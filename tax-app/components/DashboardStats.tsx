'use client';
// Build Sync Fix: 2026-02-15 17:55

import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Scale, PiggyBank, FileText, Download, Info } from 'lucide-react';
import { calculateStats } from '@/lib/calculations';
import { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AccountantReport } from './AccountantReport';
import { ScheduleCPreview } from './ScheduleCPreview';
import { HighDensityLedger } from './HighDensityLedger';
import { LayoutDashboard, FileSpreadsheet } from 'lucide-react';

export function DashboardStats() {
    const { transactions, selectedYear, selectedProjectId, projects, assets } = useStore();
    const [mounted, setMounted] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isLedgerOpen, setIsLedgerOpen] = useState(false);
    const [showTaxForm, setShowTaxForm] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const stats = useMemo(() => {
        return calculateStats(transactions, assets, projects, selectedYear, selectedProjectId);
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
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsLedgerOpen(true)}
                                className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 text-slate-900 dark:text-slate-100"
                            >
                                <Download className="h-4 w-4" />
                                Download PDF Ledger
                            </button>
                            <button
                                onClick={() => setIsReportOpen(true)}
                                className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
                            >
                                <FileText className="h-4 w-4" />
                                Generate Accountant Report
                            </button>
                        </div>
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
                        <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                            <Card className="bg-emerald-50/10 border-emerald-100/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                        <div className="group relative">
                                            <Info className="h-3 w-3 text-slate-400 cursor-help" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none font-medium">
                                                Total income received (Sum of all deposits/credits).
                                                <div className="mt-1 text-emerald-400 font-mono">Formula: Σ(Income)</div>
                                            </div>
                                        </div>
                                    </div>
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
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium">Gross Expenses</CardTitle>
                                        <div className="group relative">
                                            <Info className="h-3 w-3 text-slate-400 cursor-help" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none font-medium">
                                                Total money spent before tax adjustments.
                                                <div className="mt-1 text-rose-400 font-mono">Formula: Σ(Expenses)</div>
                                            </div>
                                        </div>
                                    </div>
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
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium">Net Cash Profit</CardTitle>
                                        <div className="group relative">
                                            <Info className="h-3 w-3 text-slate-400 cursor-help" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none font-medium">
                                                Actual cash remaining from operations.
                                                <div className="mt-1 text-blue-400 font-mono">Revenue - Expenses</div>
                                            </div>
                                        </div>
                                    </div>
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
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            <Card className="border-l-4 border-l-blue-400 bg-blue-50/5 dark:bg-blue-900/5">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100 uppercase tracking-tight">Your Total Write-offs</CardTitle>
                                        <div className="group relative text-normal capitalize">
                                            <Info className="h-3 w-3 text-blue-400 cursor-help" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none font-medium">
                                                Total amount subtracted from revenue to lower your taxable income. Incl. assets over time.
                                                <div className="mt-1 text-blue-400 font-mono">Deductions + Depreciation</div>
                                            </div>
                                        </div>
                                    </div>
                                    <Scale className="h-4 w-4 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                        ${stats.deductibleExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Money spent you DON&apos;T pay tax on</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-slate-400 bg-slate-50/50 dark:bg-slate-900/20">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium text-slate-800 dark:text-slate-200 uppercase tracking-tight">Taxable Profit</CardTitle>
                                        <div className="group relative text-normal capitalize">
                                            <Info className="h-3 w-3 text-slate-400 cursor-help" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none font-medium">
                                                The base income used for calculations. (Adjusted Gross Profit).
                                                <div className="mt-1 text-slate-300 font-mono">Revenue - (Deductions + Depr)</div>
                                            </div>
                                        </div>
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
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-md ring-1 ring-emerald-500/10">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-widest">What You Owe (Est.)</CardTitle>
                                        <div className="group relative text-normal capitalize">
                                            <Info className="h-3 w-3 text-emerald-500 cursor-help" />
                                            <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none font-medium">
                                                Aggregated estimate of Federal, Self-Employment, and State tax liabilities.
                                                <div className="mt-2 grid gap-1 border-t border-white/10 pt-2">
                                                    <div className="flex justify-between font-mono"><span className="opacity-60">Fed/SE (35%):</span><span>Profit × 0.35</span></div>
                                                    <div className="flex justify-between font-mono"><span className="opacity-60">NY (6.5%):</span><span>NY Income × 0.065</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <PiggyBank className="h-4 w-4 text-emerald-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                        ${stats.taxLiability.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
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
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            <HighDensityLedger
                isOpen={isLedgerOpen}
                onClose={() => setIsLedgerOpen(false)}
            />
            <AccountantReport
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
            />
        </div>
    );
}
