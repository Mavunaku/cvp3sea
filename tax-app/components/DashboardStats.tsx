'use client';

import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Scale, PiggyBank, FileText, Download } from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';
import { AccountantReport } from './AccountantReport';

export function DashboardStats() {
    const { transactions, selectedYear, selectedProjectId, projects, assets } = useStore();
    const [mounted, setMounted] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);

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
            .filter((t) => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);

        const expenses = filteredTransactions
            .filter((t) => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        // 2. Calculate Deductible Expenses (exclude Principal and Capitalized Repairs)
        const deductibleExpenses = filteredTransactions
            .filter((t) => t.type === 'expense')
            .reduce((acc, t) => {
                if (t.pillar === 'Interest Expense') {
                    if (t.interest !== undefined) return acc + t.interest;
                    if (t.category === 'Loan Principal') return acc;
                    return acc + t.amount;
                }
                if (t.pillar === 'Travels') {
                    if (t.category.includes('(50% Deductible)')) return acc + (t.amount * 0.5);
                    if (t.category === 'Entertainment (Non-Deductible)') return acc;
                    return acc + t.amount;
                }
                if (t.capitalize) return acc; // Skip capitalized repairs
                return acc + t.amount;
            }, 0);

        // 3. Calculate Depreciation Deduction
        const filteredAssets = assets.filter(a => {
            if (selectedProjectId) return a.projectId === selectedProjectId;
            if (selectedYear) {
                const project = projects.find(p => p.id === a.projectId);
                // Robust Fallback: Show data if project matches OR if purchase date matches (Legacy Support)
                return project?.yearId === selectedYear || a.purchaseDate?.startsWith(selectedYear);
            }
            return true;
        });

        const assetDepreciation = filteredAssets.reduce((acc, asset) => {
            const cost = asset.cost || 0;
            const businessUse = asset.businessUsePercent / 100;
            const basis = cost * businessUse;

            if (asset.currentDepreciation !== undefined) {
                return acc + asset.currentDepreciation;
            }
            if (asset.section179 || asset.bonusDepreciation) {
                return acc + basis;
            }
            return acc + Math.round(basis / asset.usefulLife);
        }, 0);

        // Capitalized Repairs (from transactions) - always 27.5 years
        const capRepairDepreciation = filteredTransactions
            .filter(t => t.capitalize === true)
            .reduce((acc, t) => acc + Math.round(t.amount / 27.5), 0);

        const totalDepreciation = assetDepreciation + capRepairDepreciation;

        const netProfit = revenue - expenses; // Cash Flow Net
        const taxableNetProfit = revenue - deductibleExpenses - totalDepreciation; // Taxable Net

        const taxRate = 0.153 + 0.25; // Estimate
        const taxLiability = taxableNetProfit > 0 ? taxableNetProfit * taxRate : 0;
        const taxSavings = (deductibleExpenses + totalDepreciation) * taxRate;

        return { revenue, expenses, deductibleExpenses, netProfit, taxableNetProfit, totalDepreciation, taxLiability, taxSavings };
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
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Tax Reporting</h3>
                        <p className="text-xs text-slate-500">Generate professional summaries for your accountant.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsReportOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
                >
                    <Download className="h-4 w-4" />
                    Generate Accountant Report
                </button>
            </div>

            <div className="space-y-6">
                {/* Section: Cash Flow */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 pl-1">
                        <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Actual Cash Flow</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="bg-emerald-50/10 border-emerald-100/50">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                    ${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-muted-foreground opacity-70 italic">Total deposits</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-rose-50/10 border-rose-100/50">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Gross Expenses</CardTitle>
                                <TrendingDown className="h-4 w-4 text-rose-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                                    ${stats.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-muted-foreground opacity-70 italic">Total money spent</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-50 border-slate-200 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Net Cash Profit</CardTitle>
                                <DollarSign className="h-4 w-4 text-slate-600" />
                            </CardHeader>
                            <CardContent>
                                <div className={cn("text-2xl font-bold", stats.netProfit >= 0 ? "text-slate-900 dark:text-slate-100" : "text-rose-600")}>
                                    ${stats.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-muted-foreground opacity-70 italic">Revenue - Expenses</p>
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
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-l-4 border-l-blue-400">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Deductible</CardTitle>
                                <Scale className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                    ${stats.deductibleExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-muted-foreground">Business write-offs</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-indigo-400">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Taxable Net Profit</CardTitle>
                                <div className="p-1 bg-indigo-50 dark:bg-indigo-900/20 rounded">
                                    <FileText className="h-3.5 w-3.5 text-indigo-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                                    ${stats.taxableNetProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-muted-foreground">Adjusted for dep. & write-offs</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-900/10">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Est. Tax Liability</CardTitle>
                                <Scale className="h-4 w-4 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                    ${stats.taxLiability.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                                    <span className="p-0.5 bg-amber-100 dark:bg-amber-900/40 rounded text-[9px] font-bold">~40.3%</span>
                                    <span>Liability estimate</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-900/10">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Potential Tax Savings</CardTitle>
                                <PiggyBank className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                    ${stats.taxSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-muted-foreground">Cash saved via write-offs</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <AccountantReport
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
            />
        </div>
    );
}

function cn(classes: string, condition?: string) {
    return classes + (condition ? " " + condition : "");
}

