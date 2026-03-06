import { Transaction, Asset, Project } from '@/types';

export interface CalculationStats {
    revenue: number;
    expenses: number;
    deductibleExpenses: number;
    netProfit: number; // Cash Flow Net
    taxableNetProfit: number; // Taxable Net
    totalDepreciation: number;
    taxLiability: number;
    taxSavings: number;
    fedTax: number;
    nyTax: number;
    nySourceIncome: number;
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
            // Robust Fallback: Show data if project matches OR if purchase date matches (Legacy Support)
            return project?.yearId === selectedYear || a.purchaseDate?.startsWith(selectedYear);
        }
        return true;
    });
}

export function calculateStats(
    transactions: Transaction[],
    assets: Asset[],
    projects: Project[],
    selectedYear: string | null,
    selectedProjectId: string | null
): CalculationStats {
    const filteredTransactions = filterTransactions(transactions, projects, selectedYear, selectedProjectId);
    const filteredAssets = filterAssets(assets, projects, selectedYear, selectedProjectId);

    const revenue = filteredTransactions
        .filter((t) => t.type === 'income')
        .reduce((acc, t) => acc + (t.amount || 0), 0);

    const expenses = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => acc + (t.amount || 0), 0);

    const deductibleExpenses = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => {
            const amount = t.amount || 0;
            if (t.pillar === 'Interest Expense') {
                if (t.interest !== undefined) return acc + t.interest;
                if (t.category === 'Loan Principal') return acc;
                return acc + amount;
            }
            if (t.pillar === 'Travels') {
                // Accounting Rule: Business meals are 50% deductible. 
                // Travel meals are also 50%. Entertainment is 0%.
                if (t.category.includes('(50% Deductible)') || t.description.toLowerCase().includes('meal')) {
                    return acc + (amount * 0.5);
                }
                if (t.category === 'Entertainment (Non-Deductible)') return acc;
                return acc + amount;
            }
            if (t.capitalize) return acc;
            return acc + amount;
        }, 0);

    // Depreciation Logic
    let fedDepreciation = 0;
    let nyDepreciation = 0;

    filteredAssets.forEach(asset => {
        const cost = asset.cost || 0;
        const businessUse = (asset.businessUsePercent || 0) / 100;
        const basis = cost * businessUse;
        const usefulLife = asset.usefulLife || 1;

        // Federal Depreciation
        let fedAmt = 0;
        if (asset.currentDepreciation !== undefined) {
            fedAmt = asset.currentDepreciation;
        } else if (asset.section179 || asset.bonusDepreciation) {
            fedAmt = basis;
        } else {
            fedAmt = Math.round(basis / usefulLife);
        }
        fedDepreciation += fedAmt;

        // NY State Depreciation (Decoupled from Federal for Section 179/Bonus in some cases)
        // If it's a "New York property", NY allows Section 179. If not, it might require MACRS add-back.
        // For this app, we'll assume a conservative "Straight Line" fallback for NY if Federal used accelerated,
        // unless it's explicitly marked as NY source.
        if (asset.projectId) {
            const proj = projects.find(p => p.id === asset.projectId);
            const isNY = proj?.name.toLowerCase().includes('ny') || proj?.name.toLowerCase().includes('orchard') || proj?.name.toLowerCase().includes('grand');

            if (isNY) {
                nyDepreciation += fedAmt;
            } else {
                // Decouple: NY usually requires MACRS (no bonus) for non-NY assets
                nyDepreciation += Math.round(basis / usefulLife);
            }
        } else {
            nyDepreciation += fedAmt;
        }
    });

    // Capitalized Repairs (27.5 years)
    const capRepairDepreciation = filteredTransactions
        .filter(t => t.capitalize === true)
        .reduce((acc, t) => acc + Math.round((t.amount || 0) / 27.5), 0);

    fedDepreciation += capRepairDepreciation;
    nyDepreciation += capRepairDepreciation;

    const netProfit = revenue - expenses;
    const taxableNetProfit = revenue - deductibleExpenses - fedDepreciation;

    const nySourceIncome = filteredTransactions
        .filter(t => t.nySource ?? true)
        .reduce((acc, t) => {
            const amount = t.amount || 0;
            if (t.type === 'income') return acc + amount;

            if (t.pillar === 'Interest Expense') {
                if (t.interest !== undefined) return acc - t.interest;
                if (t.category === 'Loan Principal') return acc;
                return acc - amount;
            }
            if (t.pillar === 'Travels') {
                if (t.category.includes('(50% Deductible)') || t.description.toLowerCase().includes('meal')) {
                    return acc - (amount * 0.5);
                }
                if (t.category === 'Entertainment (Non-Deductible)') return acc;
                return acc - amount;
            }
            if (t.capitalize) return acc;
            return acc - amount;
        }, 0) - nyDepreciation;

    const fedTaxRate = 0.35; // Combined Fed + SE Tax
    const nyTaxRate = 0.065;

    const fedTax = taxableNetProfit > 0 ? taxableNetProfit * fedTaxRate : 0;
    const nyTax = nySourceIncome > 0 ? nySourceIncome * nyTaxRate : 0;

    return {
        revenue,
        expenses,
        deductibleExpenses,
        netProfit,
        taxableNetProfit,
        totalDepreciation: fedDepreciation,
        taxLiability: fedTax + nyTax,
        taxSavings: (deductibleExpenses + fedDepreciation) * (fedTaxRate + nyTaxRate),
        fedTax,
        nyTax,
        nySourceIncome
    };
}
