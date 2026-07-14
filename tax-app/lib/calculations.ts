import { Transaction, Asset, Project, Member } from '@/types';
import { calculateYearlyDepreciation, calculateSaleYearDepreciation, calculateAccumulatedThroughYear, isRealProperty } from './depreciation';

export interface CalculationStats {
    revenue: number;
    expenses: number;
    deductibleExpenses: number;
    netProfit: number; // Cash Flow Net
    taxableNetProfit: number; // Taxable Net (all activities combined)
    totalDepreciation: number;
    taxLiability: number;
    taxSavings: number;
    fedTax: number;
    nyTax: number;
    nySourceIncome: number;
    nySourceIncomeBeforeDepr: number;
    totalWriteOffs: number; // Sum of current deductible expenses + depreciation
    section179Total: number; // Sec 179 actually allowed (after the income limitation), already included in totalDepreciation
    section179Disallowed: number; // Sec 179 elected but disallowed by the income limitation — carries forward
    pendingExcludedAmount: number; // Income/expenses excluded from the above because they're still "Pending" (not yet cash-settled)

    // Rental (Schedule E, passive, no SE tax) vs. Business (Schedule C, subject to SE tax)
    rentalNetIncome: number;
    businessNetIncome: number;
    rentalIsLoss: boolean;
    passiveLossAllowanceNote: string | null;

    // Section 199A Qualified Business Income deduction (estimate)
    qbiDeduction: number;
}

export function getTransactionDeductibleAmount(t: Transaction): number {
    const amount = t.amount || 0;
    if (t.type === 'income') return amount;

    // Rule: Capitalized repairs are not immediately deductible
    if (t.capitalize) return 0;

    if (t.pillar === 'Interest Expense') {
        // Only interest portion is deductible, not principal
        if (t.interest !== undefined) return t.interest;
        if (t.category === 'Loan Principal') return 0;
        return amount;
    }

    if (t.pillar === 'Travels') {
        // Accounting Rule: Business meals are 50% deductible.
        // Travel meals are also 50%. Entertainment is 0%.
        const isMeal = t.category.includes('(50% Deductible)') ||
            t.description.toLowerCase().includes('meal') ||
            t.category.toLowerCase().includes('meal');

        if (isMeal) {
            return amount * 0.5;
        }

        if (t.category === 'Entertainment (Non-Deductible)') return 0;
        return amount;
    }

    return amount;
}

// Cash-basis rule: a "Pending" transaction hasn't actually cleared yet (not
// paid, or income not yet received), so a cash-basis taxpayer can't count it
// this year. "Cleared" and "Reconciled" are both treated as settled.
export function isCashSettled(t: Transaction): boolean {
    return t.status !== 'Pending';
}

// Determines whether a project's income/expenses are NY-source by looking at
// the explicit `nySource` flag already set on its transactions (same signal
// used for the income-side NY calculation below), rather than guessing from
// the project's name. Falls back to a name-based guess only when a project
// has no transactions yet to check.
export function isProjectNYSource(
    projectId: string | undefined,
    allTransactions: Transaction[],
    projects: Project[]
): boolean {
    if (!projectId) return true;

    const projectTransactions = allTransactions.filter(t => t.projectId === projectId);
    if (projectTransactions.length > 0) {
        const nyCount = projectTransactions.filter(t => t.nySource ?? true).length;
        return nyCount >= projectTransactions.length / 2;
    }

    const proj = projects.find(p => p.id === projectId);
    const name = proj?.name.toLowerCase() || '';
    return name.includes('ny') || name.includes('orchard') || name.includes('grand');
}

export function filterTransactions(
    transactions: Transaction[],
    projects: Project[],
    selectedYear: string | null,
    selectedProjectId: string | null
): Transaction[] {
    return transactions.filter(t => {
        if (selectedProjectId) return t.projectId === selectedProjectId;
        if (selectedYear) {
            const project = projects.find(p => p.id === t.projectId);
            if (project) {
                return project.yearId === selectedYear;
            }
            // If it has a project ID but we can't find it in our current project list,
            // it likely belongs to another year/project we don't have loaded or doesn't match this one.
            if (t.projectId) return false;

            // Robust Fallback: Only use date if NO project ID was specified at all (loose transaction)
            return t.date.startsWith(selectedYear);
        }
        return true;
    });
}

export function filterAssets(
    assets: Asset[],
    projects: Project[],
    selectedYear: string | null,
    selectedProjectId: string | null
): Asset[] {
    return assets.filter(a => {
        if (selectedProjectId) return a.projectId === selectedProjectId;
        if (selectedYear) {
            const project = projects.find(p => p.id === a.projectId);
            if (project) {
                return project.yearId === selectedYear;
            }
            // Legacy Fallback: only use purchase date if the asset's project
            // can't be found at all (mirrors filterTransactions' logic below).
            return a.purchaseDate?.startsWith(selectedYear) ?? false;
        }
        return true;
    });
}

// A project of type "Property" is rental real estate → Schedule E, not
// subject to self-employment tax. "Client"/"Generic" projects are an active
// trade or business → Schedule C, subject to SE tax.
export function isRentalProject(projectId: string | undefined, projects: Project[]): boolean {
    if (!projectId) return true; // default to the (more common) rental case for untagged items
    const proj = projects.find(p => p.id === projectId);
    return (proj?.type ?? 'Property') === 'Property';
}

export function calculateStats(
    transactions: Transaction[],
    assets: Asset[],
    projects: Project[],
    selectedYear: string | null,
    selectedProjectId: string | null
): CalculationStats {
    const allFilteredTransactions = filterTransactions(transactions, projects, selectedYear, selectedProjectId);
    const filteredAssets = filterAssets(assets, projects, selectedYear, selectedProjectId);

    // ---- Cash basis: only count transactions that have actually cleared ----
    const pendingExcludedAmount = allFilteredTransactions
        .filter(t => !isCashSettled(t))
        .reduce((acc, t) => acc + (t.amount || 0), 0);
    const filteredTransactions = allFilteredTransactions.filter(isCashSettled);

    const revenue = filteredTransactions
        .filter((t) => t.type === 'income')
        .reduce((acc, t) => acc + (t.amount || 0), 0);

    const expenses = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => acc + (t.amount || 0), 0);

    const deductibleExpenses = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => acc + getTransactionDeductibleAmount(t), 0);

    // ---- Depreciation: real MACRS/mid-month schedule for the selected tax year ----
    const taxYear = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();

    let fedDepreciation = 0;
    let nyDepreciation = 0;
    let section179Elected = 0;
    let rentalAssetDepreciation = 0;
    let businessAssetDepreciation = 0;

    filteredAssets.forEach(asset => {
        const result = calculateYearlyDepreciation(asset, taxYear);
        fedDepreciation += result.amount;

        if (isRentalProject(asset.projectId, projects)) {
            rentalAssetDepreciation += result.amount;
        } else {
            businessAssetDepreciation += result.amount;
        }

        if (result.isServiceYear && (asset.section179)) {
            section179Elected += result.amount;
        }

        // NY State Depreciation — NY generally decouples from federal Sec
        // 179/bonus for non-NY-source assets, falling back to straight MACRS.
        const isNY = isProjectNYSource(asset.projectId, transactions, projects);
        if (isNY) {
            nyDepreciation += result.amount;
        } else if (asset.section179 || asset.bonusDepreciation) {
            // Recompute without the accelerated election for NY decoupling.
            const nyAsset: Asset = { ...asset, section179: false, bonusDepreciation: false };
            nyDepreciation += calculateYearlyDepreciation(nyAsset, taxYear).amount;
        } else {
            nyDepreciation += result.amount;
        }
    });

    // Sec 179 income limitation: the deduction can't exceed the entity's
    // aggregate trade-or-business income for the year (computed before the
    // 179 deduction itself). Anything above that is disallowed and carries
    // forward to next year — a rule this app has no way to "auto-carry", so
    // it's surfaced as a number rather than silently applied.
    const incomeBeforeSection179 = revenue - deductibleExpenses - (fedDepreciation - section179Elected);
    const section179Limit = Math.max(0, incomeBeforeSection179);
    const section179Disallowed = Math.max(0, section179Elected - section179Limit);
    const section179Total = Math.min(section179Elected, section179Limit);
    fedDepreciation -= section179Disallowed;

    // Capitalized Repairs (default 27.5-yr life, or the per-item life the user picks)
    const capitalizedTxns = filteredTransactions.filter(t => t.capitalize === true);
    const capRepairDepreciation = capitalizedTxns
        .reduce((acc, t) => acc + Math.round((t.amount || 0) / (t.capitalizeLife || 27.5)), 0);
    const capRepairRentalDepreciation = capitalizedTxns
        .filter(t => isRentalProject(t.projectId, projects))
        .reduce((acc, t) => acc + Math.round((t.amount || 0) / (t.capitalizeLife || 27.5)), 0);

    fedDepreciation += capRepairDepreciation;
    nyDepreciation += capRepairDepreciation;
    rentalAssetDepreciation += capRepairRentalDepreciation;
    businessAssetDepreciation += (capRepairDepreciation - capRepairRentalDepreciation);

    const netProfit = revenue - expenses;
    const taxableNetProfit = revenue - deductibleExpenses - fedDepreciation;

    const nySourceIncomeBeforeDepr = filteredTransactions
        .filter(t => t.nySource ?? true)
        .reduce((acc, t) => {
            const deductible = getTransactionDeductibleAmount(t);
            return t.type === 'income' ? acc + deductible : acc - deductible;
        }, 0);

    const nySourceIncome = nySourceIncomeBeforeDepr - nyDepreciation;

    // ---- Rental (Schedule E, no SE tax) vs. Business (Schedule C, SE tax) split ----
    const rentalTransactions = filteredTransactions.filter(t => isRentalProject(t.projectId, projects));
    const businessTransactions = filteredTransactions.filter(t => !isRentalProject(t.projectId, projects));

    const sumNet = (txns: Transaction[]) => {
        const rev = txns.filter(t => t.type === 'income').reduce((a, t) => a + (t.amount || 0), 0);
        const ded = txns.filter(t => t.type === 'expense').reduce((a, t) => a + getTransactionDeductibleAmount(t), 0);
        return rev - ded;
    };
    const rentalNetIncome = sumNet(rentalTransactions) - rentalAssetDepreciation;
    const businessNetIncome = sumNet(businessTransactions) - businessAssetDepreciation;

    const passiveLossAllowanceNote = rentalNetIncome < 0
        ? `Rental loss of $${Math.abs(Math.round(rentalNetIncome)).toLocaleString()}: up to $25,000 may be usable this year against other income if you actively participate and your income is under the phase-out range ($100k-$150k MAGI) — otherwise it's a suspended passive loss carried forward. This app doesn't know your other income, so this isn't applied automatically.`
        : null;

    // ---- Estimated tax (Fed/SE + NY) — SE tax only applies to the Schedule C portion ----
    const seEligibleIncome = Math.max(0, businessNetIncome);
    const fedOrdinaryRate = 0.22; // simplified flat ordinary-rate assumption
    const seTaxRate = 0.153;
    const fedOrdinaryTax = taxableNetProfit > 0 ? taxableNetProfit * fedOrdinaryRate : 0;
    const seTax = seEligibleIncome * 0.9235 * seTaxRate; // 92.35% SE-taxable base, standard rule
    const fedTax = fedOrdinaryTax + seTax;
    const nyTaxRate = 0.065;
    const nyTax = nySourceIncome > 0 ? nySourceIncome * nyTaxRate : 0;

    // ---- QBI (Sec 199A) — 20% of qualified business income, estimate only ----
    const qualifiedBusinessIncome = Math.max(0, taxableNetProfit);
    const qbiDeduction = Math.round(qualifiedBusinessIncome * 0.20);

    const totalWriteOffs = deductibleExpenses + fedDepreciation;
    const taxLiabilityBeforeQBI = fedTax + nyTax;
    const taxLiability = Math.max(0, taxLiabilityBeforeQBI - qbiDeduction * fedOrdinaryRate);

    return {
        revenue,
        expenses,
        deductibleExpenses,
        netProfit,
        taxableNetProfit,
        totalDepreciation: fedDepreciation,
        taxLiability,
        taxSavings: totalWriteOffs * (fedOrdinaryRate + seTaxRate + nyTaxRate),
        fedTax,
        nyTax,
        nySourceIncome,
        nySourceIncomeBeforeDepr,
        totalWriteOffs,
        section179Total,
        section179Disallowed,
        pendingExcludedAmount,
        rentalNetIncome,
        businessNetIncome,
        rentalIsLoss: rentalNetIncome < 0,
        passiveLossAllowanceNote,
        qbiDeduction,
    };
}

// ===== Capital Gains / Disposition (Form 4797) =====

export interface AssetDisposition {
    assetId: string;
    assetName: string;
    saleDate: string;
    amountRealized: number;          // salePrice - sellingCosts
    adjustedBasis: number;           // original cost + land - accumulated depreciation
    accumulatedDepreciation: number;
    totalGain: number;               // amountRealized - adjustedBasis (negative = loss)
    depreciationRecapture: number;   // portion taxed at ordinary (§1245) or max 25% (§1250)
    capitalGain: number;             // remaining long-term capital gain (or full loss)
    isRealProperty: boolean;         // recovery life >= 27.5 yrs (buildings/improvements)
    recaptureType: 'None' | 'Sec 1245 (Ordinary)' | 'Sec 1250 (25% Max)';
    isLoss: boolean;
}

// Total depreciation an asset has taken to date: any pre-app-tracking
// "prior depreciation" the user entered manually, PLUS the full sum of every
// MACRS-schedule year the app has tracked since the asset's service date —
// not just a single year's slice, since an asset rolled forward across
// several fiscal years needs all of them added together, or it understates
// accumulated depreciation (and overstates capital gain) once sold.
export function calculateAccumulatedDepreciation(asset: Asset, asOfYear?: number): number {
    const prior = asset.priorDepreciation || 0;
    const serviceYear = parseInt((asset.purchaseDate || '').split('-')[0], 10) || asOfYear || new Date().getFullYear();

    if (asset.saleDate) {
        const saleYear = parseInt(asset.saleDate.split('-')[0], 10);
        const throughPriorYear = saleYear > serviceYear ? calculateAccumulatedThroughYear(asset, saleYear - 1) : 0;
        return prior + throughPriorYear + calculateSaleYearDepreciation(asset, asset.saleDate);
    }

    const throughYear = asOfYear ?? new Date().getFullYear();
    return prior + calculateAccumulatedThroughYear(asset, throughYear);
}

// Computes the gain/loss on a sold asset the way Form 4797 does:
//   Amount Realized  = Sale Price − Selling Costs
//   Adjusted Basis   = Original Cost (+ Land) − Accumulated Depreciation
//   Total Gain       = Amount Realized − Adjusted Basis
// The part of the gain equal to depreciation taken is "recaptured" — taxed as
// ordinary income for personal property (§1245) or at a max 25% rate for real
// property (unrecaptured §1250 gain). The remainder is long-term capital gain.
export function calculateDisposition(asset: Asset): AssetDisposition | null {
    if (!asset.saleDate || asset.salePrice === undefined || asset.salePrice === null) return null;

    const accumulatedDepreciation = calculateAccumulatedDepreciation(asset);
    const amountRealized = (asset.salePrice || 0) - (asset.sellingCosts || 0);
    const adjustedBasis = (asset.cost || 0) + (asset.land || 0) - accumulatedDepreciation;
    const totalGain = amountRealized - adjustedBasis;
    const isRealProp = isRealProperty(asset);

    let depreciationRecapture = 0;
    let capitalGain = 0;
    let recaptureType: AssetDisposition['recaptureType'] = 'None';

    if (totalGain > 0) {
        depreciationRecapture = Math.min(accumulatedDepreciation, totalGain);
        capitalGain = totalGain - depreciationRecapture;
        if (depreciationRecapture > 0) {
            recaptureType = isRealProp ? 'Sec 1250 (25% Max)' : 'Sec 1245 (Ordinary)';
        }
    } else {
        // A loss on business property is a §1231 loss (ordinary deductible),
        // not a capital loss, and has no depreciation recapture.
        capitalGain = totalGain; // negative
    }

    return {
        assetId: asset.id,
        assetName: asset.name,
        saleDate: asset.saleDate,
        amountRealized,
        adjustedBasis,
        accumulatedDepreciation,
        totalGain,
        depreciationRecapture,
        capitalGain,
        isRealProperty: isRealProp,
        recaptureType,
        isLoss: totalGain < 0,
    };
}

export interface DispositionSummary {
    dispositions: AssetDisposition[];
    totalAmountRealized: number;
    totalAdjustedBasis: number;
    totalGain: number;               // net gain/loss across all sold assets
    totalDepreciationRecapture: number;
    totalCapitalGain: number;        // net long-term capital gain
    ordinaryLoss: number;            // §1231 losses (deductible against ordinary income)
}

export function calculateDispositions(assets: Asset[]): DispositionSummary {
    const dispositions = assets
        .map(calculateDisposition)
        .filter((d): d is AssetDisposition => d !== null);

    const totalAmountRealized = dispositions.reduce((s, d) => s + d.amountRealized, 0);
    const totalAdjustedBasis = dispositions.reduce((s, d) => s + d.adjustedBasis, 0);
    const totalGain = dispositions.reduce((s, d) => s + d.totalGain, 0);
    const totalDepreciationRecapture = dispositions.reduce((s, d) => s + d.depreciationRecapture, 0);
    const totalCapitalGain = dispositions.reduce((s, d) => s + (d.isLoss ? 0 : d.capitalGain), 0);
    const ordinaryLoss = dispositions.reduce((s, d) => s + (d.isLoss ? d.totalGain : 0), 0);

    return {
        dispositions,
        totalAmountRealized,
        totalAdjustedBasis,
        totalGain,
        totalDepreciationRecapture,
        totalCapitalGain,
        ordinaryLoss,
    };
}

export interface MemberAllocation {
    memberId: string;
    memberName: string;
    ownershipPercent: number;
    // K-1 Box 1/2: ordinary business or net rental real estate income,
    // excluding Sec 179 (which is separately stated in Box 12).
    allocatedOrdinaryIncome: number;
    allocatedSection179: number; // K-1 Box 12
}

// Splits the entity's net result across members/partners by ownership %,
// the way a Schedule K-1 (Form 1065) allocates each box to its partners.
// Returns an empty array when there's 0-1 members (i.e. no K-1 needed —
// the entity should use the Schedule C preview instead).
export function calculateMemberAllocations(
    stats: CalculationStats,
    members: Member[]
): MemberAllocation[] {
    if (members.length < 2) return [];

    const totalOwnership = members.reduce((sum, m) => sum + (m.ownershipPercent || 0), 0) || 100;
    // Ordinary/rental income before the separately-stated Sec 179 deduction
    // (taxableNetProfit already has all depreciation, incl. Sec 179, subtracted out).
    const ordinaryIncomeExclSec179 = stats.taxableNetProfit + stats.section179Total;

    return members.map(m => {
        const share = (m.ownershipPercent || 0) / totalOwnership;
        return {
            memberId: m.id,
            memberName: m.name,
            ownershipPercent: m.ownershipPercent,
            allocatedOrdinaryIncome: Math.round(ordinaryIncomeExclSec179 * share),
            allocatedSection179: Math.round(stats.section179Total * share),
        };
    });
}
