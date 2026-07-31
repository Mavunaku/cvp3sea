'use client';
// Build Sync Fix: 2026-02-15 17:55

import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Scale, PiggyBank, FileText, Download, Info, ArrowRight } from 'lucide-react';
import { calculateStats } from '@/lib/calculations';
import { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AccountantReport } from './AccountantReport';
import { ScheduleCPreview } from './ScheduleCPreview';
import { ScheduleEPreview } from './ScheduleEPreview';
import { K1Preview } from './K1Preview';
import { HighDensityLedger } from './HighDensityLedger';
import { LayoutDashboard, FileSpreadsheet, Users, Home } from 'lucide-react';

type TaxView = 'cashflow' | 'scheduleC' | 'scheduleE' | 'k1';

export function DashboardStats() {
    const { transactions, selectedYear, selectedProjectId, projects, assets, members } = useStore();
    const [mounted, setMounted] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isLedgerOpen, setIsLedgerOpen] = useState(false);
    const [taxView, setTaxView] = useState<TaxView>('cashflow');
    const showTaxForm = taxView !== 'cashflow';
    const hasMultipleMembers = members.length >= 2;

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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
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
                <div className="flex flex-wrap items-center gap-2">
                    {showTaxForm ? (
                        <button
                            onClick={() => setTaxView('cashflow')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-900 dark:text-slate-100"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Review Cash Flow
                        </button>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setTaxView('scheduleC')}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 border bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                View Schedule C Preview
                            </button>
                            <button
                                onClick={() => setTaxView('scheduleE')}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 border bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500"
                            >
                                <Home className="h-4 w-4" />
                                View Schedule E Preview
                            </button>
                            {hasMultipleMembers && (
                                <button
                                    onClick={() => setTaxView('k1')}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 border bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
                                >
                                    <Users className="h-4 w-4" />
                                    View K-1 Allocations
                                </button>
                            )}
                        </div>
                    )}
                    {!showTaxForm && (
                        <div className="flex flex-wrap items-center gap-2">
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

            {!showTaxForm && (
                <div className="grid gap-3 md:grid-cols-3 print:hidden">
                    <div className="flex items-start gap-3 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/40 dark:bg-emerald-900/10">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-tight text-emerald-800 dark:text-emerald-400">Schedule C — Active Business</h4>
                            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/70 mt-1 leading-relaxed">
                                For income from work you actively do — freelance, consulting, services. Net profit here <strong>is</strong> subject to self-employment tax (15.3%), because the IRS treats it as you earning it directly. Only transactions tagged to a &quot;Client&quot;/&quot;Generic&quot; project show up here.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/40 dark:bg-indigo-900/10">
                        <Home className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-tight text-indigo-800 dark:text-indigo-400">Schedule E — Rental Real Estate</h4>
                            <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400/70 mt-1 leading-relaxed">
                                For rent collected from properties you own. Net income here is <strong>passive</strong> — no self-employment tax applies, even though you actively manage the property. Only transactions tagged to a &quot;Property&quot; project show up here. Losses may be capped by the passive-activity-loss rules.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30 bg-purple-50/40 dark:bg-purple-900/10">
                        <Users className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-tight text-purple-800 dark:text-purple-400">K-1 Allocations — Multi-Member LLC</h4>
                            <p className="text-[11px] text-purple-700/80 dark:text-purple-400/70 mt-1 leading-relaxed">
                                If the LLC has 2+ members, this splits the combined Schedule C + E result by ownership % — the same way a real Form 1065 issues a K-1 to each partner. Only appears once you&apos;ve added members under Configure Ledgers → Members.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {taxView === 'scheduleC' ? (
                <div className="py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ScheduleCPreview />
                </div>
            ) : taxView === 'scheduleE' ? (
                <div className="py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ScheduleEPreview />
                </div>
            ) : taxView === 'k1' ? (
                <div className="py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <K1Preview />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Section: Cash Flow — shown as a left-to-right calculation chain */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 pl-1">
                            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Actual Cash Flow</h3>
                        </div>
                        <div className="flex flex-col md:flex-row items-stretch gap-2">
                            <FlowCard
                                title="Total Revenue"
                                tooltip={<>Total income received (Sum of all deposits/credits).<div className="mt-1 text-emerald-400 font-mono">Formula: Σ(Income)</div></>}
                                icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
                                value={stats.revenue}
                                valueClassName="text-emerald-700 dark:text-emerald-400"
                                caption="Total deposits"
                                className="bg-emerald-50/10 border-emerald-100/50"
                            />
                            <FlowConnector label="minus" />
                            <FlowCard
                                title="Gross Expenses"
                                tooltip={<>Total money spent before tax adjustments.<div className="mt-1 text-rose-400 font-mono">Formula: Σ(Expenses)</div></>}
                                icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
                                value={stats.expenses}
                                valueClassName="text-rose-700 dark:text-rose-400"
                                caption="Total money spent"
                                className="bg-rose-50/10 border-rose-100/50"
                            />
                            <FlowConnector label="equals" />
                            <FlowCard
                                title="Net Cash Profit"
                                tooltip={<>Actual cash remaining from operations.<div className="mt-1 text-blue-400 font-mono">Revenue - Expenses</div></>}
                                icon={<DollarSign className="h-4 w-4 text-slate-600" />}
                                value={stats.netProfit}
                                valueClassName={stats.netProfit >= 0 ? "text-slate-900 dark:text-slate-100" : "text-rose-600"}
                                caption="Revenue - Expenses"
                                className="bg-slate-50 border-slate-200 shadow-sm md:flex-[1.15]"
                                emphasized
                            />
                        </div>
                    </div>

                    {/* Section: Tax Strategy — a second calculation chain ending in the headline number */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 pl-1">
                            <div className="w-1 h-4 bg-blue-500 rounded-full" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Tax Strategy & Estimates</h3>
                        </div>
                        <div className="flex flex-col md:flex-row items-stretch gap-2">
                            <FlowCard
                                title="Your Total Write-offs"
                                tooltip={<>Total amount subtracted from revenue to lower your taxable income. Incl. assets over time.<div className="mt-1 text-blue-400 font-mono">Deductions + Depreciation</div></>}
                                icon={<Scale className="h-4 w-4 text-blue-600" />}
                                value={stats.totalWriteOffs}
                                valueClassName="text-blue-700 dark:text-blue-400"
                                caption="Money spent you DON'T pay tax on"
                                className="border-l-4 border-l-blue-400 bg-blue-50/5 dark:bg-blue-900/5"
                            />
                            <FlowConnector label="reduces" />
                            <FlowCard
                                title="Taxable Profit"
                                tooltip={<>The base income used for calculations. (Adjusted Gross Profit).<div className="mt-1 text-slate-300 font-mono">Revenue - (Deductions + Depr)</div></>}
                                icon={<FileText className="h-4 w-4 text-slate-600" />}
                                value={stats.taxableNetProfit}
                                valueClassName="text-slate-900 dark:text-slate-100"
                                caption='What the IRS sees as your "True Income"'
                                className="border-l-4 border-l-slate-400 bg-slate-50/50 dark:bg-slate-900/20"
                            />
                            <FlowConnector label="taxed + QBI" />
                            <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-md ring-1 ring-emerald-500/20 md:flex-[1.3]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-widest">What You Owe (Est.)</CardTitle>
                                        <div className="group relative text-normal capitalize">
                                            <Info className="h-3 w-3 text-emerald-500 cursor-help" />
                                            <div className="absolute bottom-full right-0 mb-2 w-72 p-3 bg-slate-900 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none font-medium">
                                                Ordinary federal tax applies to all taxable profit. Self-employment tax (15.3% on 92.35% of net income) applies ONLY to active-business (Schedule C) income, not rental real estate (Schedule E). The 20% QBI deduction (Sec 199A) is estimated and subtracted from the federal tax.
                                                <div className="mt-2 grid gap-1 border-t border-white/10 pt-2">
                                                    <div className="flex justify-between font-mono"><span className="opacity-60">Ordinary (~22%):</span><span>Profit × 0.22</span></div>
                                                    <div className="flex justify-between font-mono"><span className="opacity-60">SE (15.3%):</span><span>Business × 92.35% × 0.153</span></div>
                                                    <div className="flex justify-between font-mono"><span className="opacity-60">NY (6.5%):</span><span>NY Income × 0.065</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <PiggyBank className="h-4 w-4 text-emerald-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                                        ${stats.taxLiability.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="space-y-1 mt-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-emerald-600/70">
                                            <span>Fed (Ordinary + SE Tax):</span>
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
                                        {stats.qbiDeduction > 0 && (
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-blue-600/80">
                                                <span>Less: Est. QBI Deduction:</span>
                                                <span className="font-mono">
                                                    -${stats.qbiDeduction.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                                </span>
                                            </div>
                                        )}
                                        {stats.section179Disallowed > 0 && (
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-rose-600">
                                                <span>Sec 179 Disallowed (carries fwd):</span>
                                                <span className="font-mono">${stats.section179Disallowed.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {stats.pendingExcludedAmount > 0 && (
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-amber-600">
                                                <span>Excluded (Pending, not cash-settled):</span>
                                                <span className="font-mono">${stats.pendingExcludedAmount.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="text-[9px] text-emerald-600/50 font-bold mt-2 uppercase tracking-tighter italic border-t border-emerald-500/10 pt-1">
                                            * Approximate estimations for planning only{hasMultipleMembers && ' — see K-1 Allocations for per-member figures'}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {(stats.rentalNetIncome !== 0 || stats.businessNetIncome !== 0) && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pl-1">
                                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Income by Activity Type</h3>
                            </div>
                            <div className="flex flex-col md:flex-row items-stretch gap-2">
                                <FlowCard
                                    title="Rental Net Income (Sched. E)"
                                    tooltip={<>Net income from rental real estate. Passive — not subject to self-employment tax, but losses may be limited by the passive activity loss rules.<div className="mt-1 text-indigo-400 font-mono">Rental Revenue − Rental Deductions − Rental Depreciation</div></>}
                                    icon={<FileText className="h-4 w-4 text-indigo-600" />}
                                    value={stats.rentalNetIncome}
                                    valueClassName={stats.rentalNetIncome >= 0 ? "text-indigo-700 dark:text-indigo-400" : "text-rose-600"}
                                    caption="No SE tax applies here"
                                    className="border-l-4 border-l-indigo-400 bg-indigo-50/5 dark:bg-indigo-900/5"
                                />
                                <FlowCard
                                    title="Business Net Income (Sched. C)"
                                    tooltip={<>Net income from active trade or business activity. Subject to self-employment tax (15.3% on 92.35% of net income).<div className="mt-1 text-blue-400 font-mono">Business Revenue − Business Deductions − Business Depreciation</div></>}
                                    icon={<Scale className="h-4 w-4 text-blue-600" />}
                                    value={stats.businessNetIncome}
                                    valueClassName={stats.businessNetIncome >= 0 ? "text-blue-700 dark:text-blue-400" : "text-rose-600"}
                                    caption="Subject to SE tax (15.3%)"
                                    className="border-l-4 border-l-blue-400 bg-blue-50/5 dark:bg-blue-900/5"
                                />
                            </div>
                        </div>
                    )}

                    {stats.passiveLossAllowanceNote && (
                        <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10">
                            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                                <strong className="uppercase tracking-tight">Passive Loss Limitation (Form 8582): </strong>
                                {stats.passiveLossAllowanceNote}
                            </p>
                        </div>
                    )}
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

// A single step in a calculation chain (e.g. Revenue, in "Revenue - Expenses = Net").
// `emphasized` makes a card visually heavier so the reader's eye lands on the
// end result of the chain rather than treating every step as equally important.
function FlowCard({
    title,
    tooltip,
    icon,
    value,
    valueClassName,
    caption,
    className,
    emphasized,
}: {
    title: string;
    tooltip: React.ReactNode;
    icon: React.ReactNode;
    value: number;
    valueClassName?: string;
    caption: string;
    className?: string;
    emphasized?: boolean;
}) {
    return (
        <Card className={cn("flex-1", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <div className="group relative">
                        <Info className="h-3 w-3 text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none font-medium">
                            {tooltip}
                        </div>
                    </div>
                </div>
                {icon}
            </CardHeader>
            <CardContent>
                <div className={cn(emphasized ? "text-3xl font-black" : "text-2xl font-bold", valueClassName)}>
                    ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground opacity-70 italic">{caption}</p>
            </CardContent>
        </Card>
    );
}

// The visual "+ / − / =" style connector between chained FlowCards, so the
// math reads left-to-right instead of as unrelated boxes.
function FlowConnector({ label }: { label: string }) {
    return (
        <div className="flex md:flex-col items-center justify-center gap-1 py-1 md:py-0 md:px-1 shrink-0">
            <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 rotate-90 md:rotate-0" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 whitespace-nowrap">
                {label}
            </span>
        </div>
    );
}
