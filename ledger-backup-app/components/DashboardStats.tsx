'use client';

import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Scale, PiggyBank, FileText, Download, Info, X } from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AccountantReport } from './AccountantReport';
import { ScheduleCPreview } from './ScheduleCPreview';
import { LayoutDashboard, FileSpreadsheet } from 'lucide-react';

export function DashboardStats() {
    const { transactions, selectedYear, selectedProjectId, projects, assets } = useStore();
    const [mounted, setMounted] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [showTaxForm, setShowTaxForm] = useState(false);
    const [showWriteoffsInfo, setShowWriteoffsInfo] = useState(false);
    const [showTaxableProfitInfo, setShowTaxableProfitInfo] = useState(false);
    const [showTaxLiabilityInfo, setShowTaxLiabilityInfo] = useState(false);
    const [showRevenueInfo, setShowRevenueInfo] = useState(false);
    const [showExpensesInfo, setShowExpensesInfo] = useState(false);
    const [showNetProfitInfo, setShowNetProfitInfo] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const stats = useMemo(() => {
        // 1. Filter Transactions based on Global Context
        const filteredTransactions = transactions.filter(t => {
            if (selectedProjectId) return t.projectId === selectedProjectId;
            if (selectedYear) {
                const project = projects.find(p => p.id === t.projectId);
                // Robust Fallback: Show data if project matches OR if date matches (Legacy Support)
                return project?.yearId === selectedYear || t.date.startsWith(selectedYear);
            }
            return true;
        });

        const revenue = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + (t.amount || 0), 0);

        const expenses = filteredTransactions
            .filter((t) => t.type === 'expense')
            .reduce((acc, t) => {
                if (t.capitalize) return acc;
                return acc + (t.amount || 0);
            }, 0);

        const deductibleExpenses = filteredTransactions
            .filter((t) => t.type === 'expense')
            .reduce((acc, t) => {
                const amount = t.amount || 0;
                if (t.capitalize) return acc;
                if (t.category === 'Entertainment (Non-Deductible)') return acc;

                if (t.interest !== undefined && t.pillar === 'Interest Expense') {
                    return acc + (t.interest || 0);
                }

                if (t.category && (t.category.includes('Meals') || t.category.includes('(50% Deductible)'))) {
                    return acc + (amount * 0.5);
                }

                return acc + amount;
            }, 0);

        // 3. Calculate Depreciation Deduction
        const filteredAssets = assets.filter(a => {
            if (selectedProjectId) return a.projectId === selectedProjectId;

            if (selectedYear) {
                // If a year is selected, include assets:
                // 1. Belonging to projects in that year
                // 2. OR purchased in that year
                // 3. AND (Crucially) assets from PRIOR years that are still depreciating
                const project = projects.find(p => p.id === a.projectId);
                const isProjectInYear = project?.yearId === selectedYear;
                const isPurchasedInYear = a.purchaseDate?.startsWith(selectedYear);

                // If it's a specific folder/project selected, it was handled by selectedProjectId above.
                // If we are looking at the "Overall Year" (selectedYear is set, selectedProjectId is null):
                // We should show ALL assets that contribute to this year's depreciation.

                const purchaseYear = a.purchaseDate ? parseInt(a.purchaseDate.split('-')[0]) : null;
                const currentYear = parseInt(selectedYear);

                if (isProjectInYear || isPurchasedInYear) return true;

                // Include older assets if they are STILL in their recovery period
                if (purchaseYear && purchaseYear < currentYear) {
                    const usefulLife = a.usefulLife || 5;
                    if (purchaseYear + usefulLife > currentYear) return true;
                }

                return false;
            }
            return true;
        });

        const assetDepreciation = filteredAssets.reduce((acc, asset) => {
            const cost = asset.cost || 0;
            const businessUse = (asset.businessUsePercent || 100) / 100;
            const basis = cost * businessUse;

            if (asset.currentDepreciation !== undefined) {
                return acc + asset.currentDepreciation;
            }
            if (asset.section179 || asset.bonusDepreciation) {
                return acc + basis;
            }
            const life = asset.usefulLife || 5;
            return acc + Math.round(basis / life);
        }, 0);

        // Capitalized Repairs (from transactions) - use custom useful life
        const capRepairDepreciation = filteredTransactions
            .filter(t => t.capitalize === true)
            .reduce((acc, t) => {
                const usefulLife = t.capitalizeUsefulLife || 27.5;
                return acc + Math.round((t.amount || 0) / usefulLife);
            }, 0);

        const totalDepreciation = assetDepreciation + capRepairDepreciation;

        const netProfit = revenue - expenses; // Cash Flow Net
        const taxableNetProfit = revenue - deductibleExpenses - totalDepreciation; // Taxable Net

        const nySourceIncome = filteredTransactions
            .filter(t => t.nySource ?? true)
            .reduce((acc, t) => {
                const amount = t.amount || 0;
                if (t.type === 'income') return acc + amount;

                if (t.pillar === 'Interest Expense') {
                    if (t.interest !== undefined) return acc - (t.interest || 0);
                    if (t.category === 'Loan Principal') return acc;
                    return acc - amount;
                }
                if (t.pillar === 'Travels') {
                    if (t.category.includes('(50% Deductible)')) return acc - (amount * 0.5);
                    if (t.category === 'Entertainment (Non-Deductible)') return acc;
                    return acc - amount;
                }
                if (t.capitalize) return acc;
                return acc - amount;
            }, 0) - (totalDepreciation); // Subtract depreciation from NY source income too

        const fedTaxRate = 0.35;
        const nyTaxRate = 0.065;

        const fedTax = taxableNetProfit > 0 ? taxableNetProfit * fedTaxRate : 0;
        const nyTax = nySourceIncome > 0 ? nySourceIncome * nyTaxRate : 0;
        const taxLiability = fedTax + nyTax;
        const taxSavings = (deductibleExpenses + totalDepreciation) * (fedTaxRate + nyTaxRate);

        return {
            revenue,
            expenses,
            deductibleExpenses,
            netProfit,
            taxableNetProfit,
            totalDepreciation,
            taxLiability,
            taxSavings,
            fedTax,
            nyTax
        };
    }, [transactions, assets, selectedYear, selectedProjectId, projects]);

    if (!mounted) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 animate-pulse">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 rounded-lg bg-sage-100 dark:bg-sage-800/50" />
            ))}
        </div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        {showTaxForm ? <LayoutDashboard className="h-5 w-5 text-blue-600" /> : <FileText className="h-5 w-5 text-blue-600" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">{showTaxForm ? "Standard Dashboard" : "Tax Reporting"}</h3>
                        <p className="text-xs text-slate-500">
                            {showTaxForm ? "Switch back to the overview of your cash flow and stats." : "Generate professional summaries for your accountant."}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowTaxForm(!showTaxForm)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 border",
                            showTaxForm
                                ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-900 dark:text-slate-100"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500"
                        )}
                    >
                        {showTaxForm ? (
                            <>
                                <LayoutDashboard className="h-4 w-4" />
                                Review Cash Flow
                            </>
                        ) : (
                            <>
                                <FileSpreadsheet className="h-4 w-4" />
                                View Schedule C Preview
                            </>
                        )}
                    </button>
                    {!showTaxForm && (
                        <button
                            onClick={() => setIsReportOpen(true)}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
                        >
                            <Download className="h-4 w-4" />
                            Generate Accountant Report
                        </button>
                    )}
                </div>
            </div>

            {showTaxForm ? (
                <div className="py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ScheduleCPreview />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Section: Cash Flow */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 pl-1">
                            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Actual Cash Flow</h3>
                        </div>
                        {/* Top Cards */}
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="bg-emerald-50/10 border-emerald-100/50 relative">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                        <button
                                            onClick={() => setShowRevenueInfo(!showRevenueInfo)}
                                            className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-full transition-colors"
                                            title="Show calculation details"
                                        >
                                            <Info className="h-3.5 w-3.5 text-emerald-600" />
                                        </button>
                                    </div>
                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                        ${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-xs text-muted-foreground opacity-70 italic">Total deposits</p>
                                    {showRevenueInfo && (
                                        <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                                            <div className="font-bold text-emerald-900 dark:text-emerald-100 mb-2">Calculation:</div>
                                            <div className="flex justify-between">
                                                <span>Sum of all income transactions</span>
                                                <span className="font-mono">${stats.revenue.toLocaleString()}</span>
                                            </div>
                                            <div className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-2 italic">
                                                Filtered by selected year/project
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="bg-rose-50/10 border-rose-100/50 relative">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium">Gross Expenses</CardTitle>
                                        <button
                                            onClick={() => setShowExpensesInfo(!showExpensesInfo)}
                                            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-full transition-colors"
                                            title="Show calculation details"
                                        >
                                            <Info className="h-3.5 w-3.5 text-rose-600" />
                                        </button>
                                    </div>
                                    <TrendingDown className="h-4 w-4 text-rose-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                                        ${stats.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-xs text-muted-foreground opacity-70 italic">Total money spent</p>
                                    {showExpensesInfo && (
                                        <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800 text-xs space-y-1">
                                            <div className="font-bold text-rose-900 dark:text-rose-100 mb-2">Calculation:</div>
                                            <div className="flex justify-between">
                                                <span>Sum of all expense transactions</span>
                                                <span className="font-mono">${stats.expenses.toLocaleString()}</span>
                                            </div>
                                            <div className="text-[10px] text-rose-700 dark:text-rose-300 mt-2 italic">
                                                Includes ALL expenses (principal, capitalized, etc.)
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-50 border-slate-200 shadow-sm relative">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium">Net Cash Profit</CardTitle>
                                        <button
                                            onClick={() => setShowNetProfitInfo(!showNetProfitInfo)}
                                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                                            title="Show calculation details"
                                        >
                                            <Info className="h-3.5 w-3.5 text-slate-600" />
                                        </button>
                                    </div>
                                    <DollarSign className="h-4 w-4 text-slate-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className={cn("text-2xl font-bold", stats.netProfit >= 0 ? "text-slate-900 dark:text-slate-100" : "text-rose-600")}>
                                        ${stats.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-xs text-muted-foreground opacity-70 italic">Revenue - Expenses</p>
                                    {showNetProfitInfo && (
                                        <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 text-xs space-y-1">
                                            <div className="font-bold text-slate-900 dark:text-slate-100 mb-2">Calculation:</div>
                                            <div className="flex justify-between">
                                                <span>Total Revenue:</span>
                                                <span className="font-mono">${stats.revenue.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>- Gross Expenses:</span>
                                                <span className="font-mono">${stats.expenses.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-slate-400 dark:border-slate-600 pt-1 mt-1 font-bold">
                                                <span>= Net Cash Profit:</span>
                                                <span className="font-mono">${stats.netProfit.toLocaleString()}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-2 italic">
                                                This is your actual cash flow (before taxes)
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Section: Tax Strategy */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 pl-1">
                            <div className="w-1 h-4 bg-blue-500 rounded-full" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Tax Strategy & Estimates</h3>
                        </div>
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            <Card className="border-l-4 border-l-blue-400 bg-blue-50/5 dark:bg-blue-900/5 relative">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100 uppercase tracking-tight">Your Total Write-offs</CardTitle>
                                        <button
                                            onClick={() => setShowWriteoffsInfo(!showWriteoffsInfo)}
                                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full transition-colors"
                                            title="Show calculation details"
                                        >
                                            <Info className="h-3.5 w-3.5 text-blue-600" />
                                        </button>
                                    </div>
                                    <Scale className="h-4 w-4 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                        ${(stats.deductibleExpenses + stats.totalDepreciation).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <p className="text-xs text-muted-foreground">Money spent you DON&apos;T pay tax on</p>
                                        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-800">
                                            Includes Depr.
                                        </span>
                                    </div>
                                    {showWriteoffsInfo && (
                                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-xs space-y-1">
                                            <div className="font-bold text-blue-900 dark:text-blue-100 mb-2">Calculation:</div>
                                            <div className="flex justify-between">
                                                <span>Deductible Expenses:</span>
                                                <span className="font-mono">${stats.deductibleExpenses.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>+ Total Depreciation:</span>
                                                <span className="font-mono">${stats.totalDepreciation.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-blue-300 dark:border-blue-700 pt-1 mt-1 font-bold">
                                                <span>= Total Write-offs:</span>
                                                <span className="font-mono">${(stats.deductibleExpenses + stats.totalDepreciation).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-slate-400 bg-slate-50/50 dark:bg-slate-900/20 relative">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium text-slate-800 dark:text-slate-200 uppercase tracking-tight">Taxable Profit</CardTitle>
                                        <button
                                            onClick={() => setShowTaxableProfitInfo(!showTaxableProfitInfo)}
                                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                                            title="Show calculation details"
                                        >
                                            <Info className="h-3.5 w-3.5 text-slate-600" />
                                        </button>
                                    </div>
                                    <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded">
                                        <FileText className="h-3.5 w-3.5 text-slate-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                        ${stats.taxableNetProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">What the IRS sees as your &quot;True Income&quot;</p>
                                    {showTaxableProfitInfo && (
                                        <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 text-xs space-y-1">
                                            <div className="font-bold text-slate-900 dark:text-slate-100 mb-2">Calculation:</div>
                                            <div className="flex justify-between">
                                                <span>Revenue:</span>
                                                <span className="font-mono">${stats.revenue.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>- Deductible Expenses:</span>
                                                <span className="font-mono">${stats.deductibleExpenses.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>- Depreciation:</span>
                                                <span className="font-mono">${stats.totalDepreciation.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-slate-400 dark:border-slate-600 pt-1 mt-1 font-bold">
                                                <span>= Taxable Profit:</span>
                                                <span className="font-mono">${stats.taxableNetProfit.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-md ring-1 ring-emerald-500/10 relative">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-widest">What You Owe (Est.)</CardTitle>
                                        <button
                                            onClick={() => setShowTaxLiabilityInfo(!showTaxLiabilityInfo)}
                                            className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-full transition-colors"
                                            title="Show calculation details"
                                        >
                                            <Info className="h-3.5 w-3.5 text-emerald-600" />
                                        </button>
                                    </div>
                                    <PiggyBank className="h-4 w-4 text-emerald-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                        ${stats.taxLiability.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>

                                    {/* Debug / Explanation Details */}
                                    <details className="mt-2 text-xs text-slate-500 cursor-pointer">
                                        <summary className="hover:text-emerald-600 transition-colors">Calculation Details</summary>
                                        <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 space-y-1 font-mono">
                                            <div className="flex justify-between">
                                                <span>Revenue:</span>
                                                <span>${stats.revenue.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-rose-500">
                                                <span>- Deductions:</span>
                                                <span>(${stats.deductibleExpenses.toLocaleString()})</span>
                                            </div>
                                            <div className="flex justify-between text-rose-500">
                                                <span>- Depreciation:</span>
                                                <span>(${stats.totalDepreciation.toLocaleString()})</span>
                                            </div>
                                            <div className="border-t border-slate-300 dark:border-slate-600 my-1 pt-1 flex justify-between font-bold">
                                                <span>= Taxable Net:</span>
                                                <span className={stats.taxableNetProfit < 0 ? "text-rose-500" : "text-emerald-600"}>
                                                    ${stats.taxableNetProfit.toLocaleString()}
                                                </span>
                                            </div>
                                            {stats.taxableNetProfit <= 0 && (
                                                <div className="text-[10px] text-amber-600 italic mt-1">
                                                    * No tax due because taxable net profit is zero or negative.
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                    <div className="space-y-1 mt-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-emerald-600/70">
                                            <span>Fed/SE Tax (35%):</span>
                                            <span className="font-mono text-emerald-800 dark:text-emerald-200">
                                                ${stats.fedTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-emerald-600/70">
                                            <span>NY State Tax (6.5%):</span>
                                            <span className="font-mono text-emerald-800 dark:text-emerald-200">
                                                ${stats.nyTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="text-[9px] text-emerald-600/50 font-bold mt-2 uppercase tracking-tighter italic border-t border-emerald-500/10 pt-1">
                                            * Approximate estimations for planning only
                                        </div>
                                    </div>
                                    {showTaxLiabilityInfo && (
                                        <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                                            <div className="font-bold text-emerald-900 dark:text-emerald-100 mb-2">Calculation:</div>
                                            <div className="space-y-1">
                                                <div className="font-semibold text-emerald-800 dark:text-emerald-200">Federal Tax (35%):</div>
                                                <div className="flex justify-between pl-2">
                                                    <span>Taxable Profit × 0.35</span>
                                                    <span className="font-mono">${stats.taxableNetProfit.toLocaleString()} × 0.35</span>
                                                </div>
                                                <div className="flex justify-between pl-2 font-bold">
                                                    <span>= Federal Tax:</span>
                                                    <span className="font-mono">${stats.fedTax.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1 pt-2 border-t border-emerald-300 dark:border-emerald-700">
                                                <div className="font-semibold text-emerald-800 dark:text-emerald-200">NY State Tax (6.5%):</div>
                                                <div className="flex justify-between pl-2">
                                                    <span>NY Source Income × 0.065</span>
                                                    <span className="font-mono text-[10px]">(Rev - Exp - Depr) × 0.065</span>
                                                </div>
                                                <div className="flex justify-between pl-2 font-bold">
                                                    <span>= NY State Tax:</span>
                                                    <span className="font-mono">${stats.nyTax.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between border-t-2 border-emerald-400 dark:border-emerald-600 pt-2 mt-2 font-bold text-emerald-900 dark:text-emerald-100">
                                                <span>Total Tax Liability:</span>
                                                <span className="font-mono">${stats.taxLiability.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            <AccountantReport
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
            />
        </div>
    );
}

