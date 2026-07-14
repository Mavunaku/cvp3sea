import { Asset } from '@/types';

// ============================================================================
// MACRS Depreciation Engine
//
// Instead of hardcoding the IRS Pub 946 percentage tables from memory (risky
// — a single mistyped digit would silently misstate everyone's deduction),
// this computes them the same way the IRS derives them: declining-balance
// depreciation that switches to straight-line the year SL would produce a
// bigger deduction, under the half-year, mid-quarter, or mid-month
// convention. This is independently verifiable — the generated schedule for
// 5-year 200% DB / half-year, for example, reproduces the published
// [20, 32, 19.2, 11.52, 11.52, 5.76] exactly (verified during development).
// ============================================================================

export type DepreciationMethod = 'MACRS' | 'Straight Line' | 'S/L (Mid-Mo)' | 'S/L (Half-Yr)';
export type Convention = 'HY' | 'MQ' | 'MM';

/**
 * Generates the year-by-year depreciation schedule as fractions of original
 * basis (they sum to 1.0). `alwaysStraightLine` is used for real property
 * (27.5/39-yr buildings), which never gets declining-balance treatment.
 */
export function generateDepreciationSchedule(
    lifeYears: number,
    firstYearFraction: number,
    alwaysStraightLine: boolean
): number[] {
    const dbRate = lifeYears <= 10 ? 2.0 : 1.5; // 200% DB for 3/5/7/10-yr, 150% DB for 15/20-yr
    const schedule: number[] = [];
    let remainingBasis = 1.0;
    let remainingYears = lifeYears;
    let switched = alwaysStraightLine;
    let index = 0;

    while (remainingBasis > 0.0005 && index < lifeYears + 3) {
        const periodFraction = index === 0 ? firstYearFraction : Math.min(1.0, remainingYears);
        if (periodFraction <= 0) break;

        let depAmount: number;
        if (!switched) {
            const dbAmount = remainingBasis * (dbRate / lifeYears) * periodFraction;
            const slAmount = remainingYears > 0 ? remainingBasis * (periodFraction / remainingYears) : remainingBasis;
            if (slAmount >= dbAmount) {
                switched = true;
                depAmount = slAmount;
            } else {
                depAmount = dbAmount;
            }
        } else {
            depAmount = remainingYears > 0 ? remainingBasis * (periodFraction / remainingYears) : remainingBasis;
        }

        depAmount = Math.min(depAmount, remainingBasis);
        schedule.push(depAmount);
        remainingBasis -= depAmount;
        remainingYears -= periodFraction;
        index++;
    }

    return schedule;
}

function parseDate(dateStr: string): { year: number; month: number } {
    const [y, m] = dateStr.split('-').map(Number);
    return { year: y, month: m || 1 };
}

function quarterOf(month: number): 1 | 2 | 3 | 4 {
    return (Math.ceil(month / 3) as 1 | 2 | 3 | 4);
}

// Half-year convention: always exactly half a year in the placed-in-service year.
// Mid-quarter: 10.5/7.5/4.5/1.5 months ÷ 12, depending on which quarter.
// Mid-month (real property): (12 - month + 0.5) / 12.
function firstYearFraction(asset: Asset, isRealProperty: boolean): number {
    const { month } = parseDate(asset.purchaseDate);
    if (isRealProperty) {
        return (12 - month + 0.5) / 12;
    }
    if (asset.convention === 'MQ') {
        const q = quarterOf(month);
        return { 1: 10.5, 2: 7.5, 3: 4.5, 4: 1.5 }[q] / 12;
    }
    return 0.5; // HY default
}

// The schedule is cached per (life, firstYearFraction, isRealProperty) triple
// since it's pure math with no per-asset state.
const scheduleCache = new Map<string, number[]>();
function getSchedule(lifeYears: number, fyFraction: number, isRealProperty: boolean): number[] {
    const key = `${lifeYears}|${fyFraction.toFixed(6)}|${isRealProperty}`;
    let sched = scheduleCache.get(key);
    if (!sched) {
        sched = generateDepreciationSchedule(lifeYears, fyFraction, isRealProperty);
        scheduleCache.set(key, sched);
    }
    return sched;
}

export function isRealProperty(asset: Asset): boolean {
    return (asset.usefulLife || 0) >= 27.5;
}

/**
 * The recovery year number (1-indexed) for a given tax year: 1 in the year
 * placed in service, 2 the next year, etc. Returns 0 if the asset wasn't yet
 * placed in service, or a number past the schedule length if fully depreciated.
 */
export function recoveryYearNumber(asset: Asset, taxYear: number): number {
    const { year: serviceYear } = parseDate(asset.purchaseDate);
    return taxYear - serviceYear + 1;
}

export interface DepreciationResult {
    amount: number;
    recoveryYear: number;
    isFullyDepreciated: boolean;
    isServiceYear: boolean;
}

/**
 * Computes the depreciation deduction for a SPECIFIC tax year — the core fix
 * that makes the Method/Convention dropdowns actually change the numbers, and
 * makes Section 179/bonus apply only in the year the asset was placed in
 * service (not silently every year it's viewed).
 */
export function calculateYearlyDepreciation(asset: Asset, taxYear: number): DepreciationResult {
    const cost = asset.cost || 0;
    const businessUse = (asset.businessUsePercent || 0) / 100;
    const basis = cost * businessUse;
    const life = asset.usefulLife || 1;
    const recYear = recoveryYearNumber(asset, taxYear);
    const isService = recYear === 1;

    // Manual override always wins for the year it's set, but only applies to
    // the currently-viewed tax year — it does NOT repeat in other years.
    if (asset.currentDepreciation !== undefined && isService) {
        return { amount: asset.currentDepreciation, recoveryYear: recYear, isFullyDepreciated: false, isServiceYear: isService };
    }

    if (recYear < 1) {
        return { amount: 0, recoveryYear: recYear, isFullyDepreciated: false, isServiceYear: false };
    }

    // Section 179 / Bonus: 100% of basis, but ONLY in the service year.
    if (asset.section179 || asset.bonusDepreciation) {
        if (isService) {
            return { amount: basis, recoveryYear: recYear, isFullyDepreciated: true, isServiceYear: true };
        }
        return { amount: 0, recoveryYear: recYear, isFullyDepreciated: true, isServiceYear: false };
    }

    const realProp = isRealProperty(asset);
    const fyFraction = firstYearFraction(asset, realProp);
    const schedule = getSchedule(life, fyFraction, realProp);
    const idx = recYear - 1;

    if (idx < 0 || idx >= schedule.length) {
        return { amount: 0, recoveryYear: recYear, isFullyDepreciated: true, isServiceYear: false };
    }

    return {
        amount: Math.round(basis * schedule[idx]),
        recoveryYear: recYear,
        isFullyDepreciated: idx === schedule.length - 1,
        isServiceYear: isService,
    };
}

/**
 * Total depreciation accumulated from the service year through (and
 * including) the given tax year — used for basis calculations on sale.
 * If taxYear is omitted, sums the entire schedule (fully depreciated total).
 */
export function calculateAccumulatedThroughYear(asset: Asset, throughYear?: number): number {
    const { year: serviceYear } = parseDate(asset.purchaseDate);
    const lastYear = throughYear ?? serviceYear + 100; // effectively "all of it"
    let total = asset.priorDepreciation ? 0 : 0; // priorDepreciation is handled separately by callers that need it
    for (let y = serviceYear; y <= lastYear; y++) {
        const r = calculateYearlyDepreciation(asset, y);
        total += r.amount;
        if (r.isFullyDepreciated) break;
    }
    return total;
}

/**
 * Depreciation allowed in the specific year an asset is SOLD — prorated by
 * the same convention as the placed-in-service year (half-year assets always
 * get half a year's worth in their final year; mid-month real property gets
 * prorated by the month of sale), regardless of where in the recovery
 * schedule the asset otherwise sits.
 */
export function calculateSaleYearDepreciation(asset: Asset, saleDate: string): number {
    const cost = asset.cost || 0;
    const businessUse = (asset.businessUsePercent || 0) / 100;
    const basis = cost * businessUse;
    const life = asset.usefulLife || 1;

    if (asset.section179 || asset.bonusDepreciation || asset.currentDepreciation !== undefined) {
        return 0; // already fully expensed in the service year
    }

    const realProp = isRealProperty(asset);
    const { year: saleYear, month: saleMonth } = parseDate(saleDate);
    const recYear = recoveryYearNumber(asset, saleYear);
    if (recYear < 1) return 0;

    const fyFraction = firstYearFraction(asset, realProp);
    const schedule = getSchedule(life, fyFraction, realProp);
    const idx = recYear - 1;
    if (idx < 0 || idx >= schedule.length) return 0;

    // Full-year rate this recovery year would have gotten, then reprorate for
    // a partial year of disposal.
    const fullYearRate = schedule[idx] / (idx === 0 ? fyFraction : 1);
    let saleYearFraction: number;
    if (realProp) {
        saleYearFraction = (saleMonth - 0.5) / 12; // mid-month
    } else if (asset.convention === 'MQ') {
        const q = quarterOf(saleMonth);
        saleYearFraction = ({ 1: 1.5, 2: 4.5, 3: 7.5, 4: 10.5 } as Record<number, number>)[q] / 12;
    } else {
        saleYearFraction = 0.5; // half-year, regardless of actual sale month
    }
    // In the service year itself, can't take more than the service-year fraction already implies.
    const effectiveFraction = idx === 0 ? Math.min(saleYearFraction, fyFraction) : saleYearFraction;

    return Math.round(basis * fullYearRate * effectiveFraction);
}
