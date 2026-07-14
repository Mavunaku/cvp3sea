'use client';

import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Transaction } from '@/types';

import { calculateStats, filterTransactions, filterAssets, getTransactionDeductibleAmount, isCashSettled, isRentalProject } from '@/lib/calculations';
import { calculateYearlyDepreciation } from '@/lib/depreciation';

interface ScheduleCLine {
    label: string;
    value: number;
    subLabel?: string;
    isBold?: boolean;
    indent?: boolean;
}

export function ScheduleCPreview() {
    const { transactions, selectedYear, selectedProjectId, projects, assets } = useStore();

    const stats = useMemo(() => {
        return calculateStats(transactions, assets, projects, selectedYear, selectedProjectId);
    }, [transactions, assets, projects, selectedYear, selectedProjectId]);

    const data = useMemo(() => {
        const taxYear = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();

        // Schedule C is the active trade/business activity only — rental real
        // estate is reported on Schedule E instead, so it's excluded here to
        // avoid double-counting the same income/expenses on both previews.
        const filteredTransactions = filterTransactions(transactions, projects, selectedYear, selectedProjectId)
            .filter(isCashSettled)
            .filter(t => !isRentalProject(t.projectId, projects));
        const businessAssets = filterAssets(assets, projects, selectedYear, selectedProjectId)
            .filter(a => !isRentalProject(a.projectId, projects));

        const income = filteredTransactions.filter(t => t.type === 'income');
        const expenses = filteredTransactions.filter(t => t.type === 'expense');
        const grossReceipts = income.reduce((acc, t) => acc + (t.amount || 0), 0);

        const getSum = (pill: string, cat?: string) => {
            return expenses
                .filter(t => {
                    const matchPillar = t.pillar === pill;
                    if (cat) return matchPillar && t.category === cat;
                    return matchPillar;
                })
                .reduce((acc, t) => {
                    return acc + getTransactionDeductibleAmount(t);
                }, 0);
        };

        const advertising = getSum('General Business', 'Advertising');
        const insurance = getSum('General Business', 'Insurance');
        const mortgageInterest = getSum('Interest Expense');
        const repairs = getSum('Repairs');
        const utilities = getSum('Utilities');
        const taxesAndLicenses = getSum('Taxes Paid');
        const travel = expenses
            .filter(t => t.pillar === 'Travels' && t.category === 'Auto & Travel')
            .reduce((acc, t) => acc + getTransactionDeductibleAmount(t), 0);

        const meals = expenses
            .filter(t => t.pillar === 'Travels' && (t.category.includes('(50% Deductible)') || t.description.toLowerCase().includes('meal') || t.category.toLowerCase().includes('meal')))
            .reduce((acc, t) => acc + getTransactionDeductibleAmount(t), 0);

        const otherExpenses = expenses
            .filter(t => {
                const knownPillars = ['General Business', 'Interest Expense', 'Repairs', 'Utilities', 'Travels', 'Taxes Paid'];
                if (knownPillars.includes(t.pillar || '')) {
                    if (t.pillar === 'General Business' && (t.category === 'Advertising' || t.category === 'Insurance')) return false;
                    if (t.pillar === 'Travels') return false;
                    if (t.pillar === 'Interest Expense' || t.pillar === 'Repairs' || t.pillar === 'Utilities' || t.pillar === 'Taxes Paid') return false;
                    return true;
                }
                return true;
            })
            .reduce((acc, t) => acc + getTransactionDeductibleAmount(t), 0);

        const depreciation = businessAssets.reduce((acc, a) => acc + calculateYearlyDepreciation(a, taxYear).amount, 0)
            + expenses
                .filter(t => t.capitalize === true)
                .reduce((acc, t) => acc + Math.round((t.amount || 0) / (t.capitalizeLife || 27.5)), 0);

        const totalExpenses = advertising + insurance + mortgageInterest + repairs + utilities
            + taxesAndLicenses + travel + meals + depreciation + otherExpenses;

        return {
            grossReceipts,
            advertising,
            insurance,
            mortgageInterest,
            repairs,
            utilities,
            taxesAndLicenses,
            travel,
            meals,
            depreciation,
            otherExpenses,
            totalExpenses,
            netProfit: grossReceipts - totalExpenses,
        };
    }, [transactions, assets, projects, selectedYear, selectedProjectId]);

    const lines: ScheduleCLine[] = [
        { label: "1. Gross receipts or sales", value: data.grossReceipts, isBold: true },
        { label: "Part II Expenses", value: 0, subLabel: "Enter relevant amounts below", isBold: true },
        { label: "8. Advertising", value: data.advertising, indent: true },
        { label: "15. Insurance (other than health)", value: data.insurance, indent: true },
        { label: "16a. Mortgage interest paid to banks", value: data.mortgageInterest, indent: true },
        { label: "21. Repairs and maintenance", value: data.repairs, indent: true },
        { label: "23. Taxes and licenses", value: data.taxesAndLicenses, indent: true },
        { label: "24a. Travel", value: data.travel, indent: true },
        { label: "24b. Deductible meals (50%)", value: data.meals, indent: true },
        { label: "13. Depreciation (from Page 2)", value: data.depreciation, indent: true },
        { label: "25. Utilities", value: data.utilities, indent: true },
        { label: "27a. Other expenses", value: data.otherExpenses, indent: true },
        { label: "28. Total expenses", value: data.totalExpenses, isBold: true },
        { label: "31. Net profit or (loss)", value: data.netProfit, isBold: true, subLabel: "Line 1 minus Line 28" },
    ];

    return (
        <Card className="max-w-4xl mx-auto bg-white dark:bg-slate-950 border-double border-4 border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b bg-slate-50 dark:bg-slate-900/50">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tighter uppercase">Schedule C</CardTitle>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Form 1040 | Profit or Loss From Business</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold">{selectedYear || 'All Time'}</div>
                        <p className="text-[8px] text-muted-foreground uppercase">Estimated Preview Only</p>
                    </div>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-3 leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-3">
                    This is for <strong>active business work</strong> — freelance, consulting, services you personally perform. Net profit here is subject to <strong>self-employment tax (15.3%)</strong> on top of income tax. Rental real estate does not belong here — see Schedule E instead. Only transactions tagged to a &quot;Client&quot; or &quot;Generic&quot; project (not &quot;Property&quot;) are included.
                </p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-900">
                    {lines.map((line, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex justify-between items-center p-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors",
                                line.isBold && "bg-slate-50/30 dark:bg-slate-900/20"
                            )}
                        >
                            <div className={cn("flex flex-col", line.indent && "pl-8")}>
                                <span className={cn("text-xs", line.isBold ? "font-bold text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400")}>
                                    {line.label}
                                </span>
                                {line.subLabel && (
                                    <span className="text-[9px] text-muted-foreground italic">{line.subLabel}</span>
                                )}
                            </div>
                            <div className={cn(
                                "font-mono text-sm",
                                line.isBold ? "font-black text-slate-950 dark:text-white" : "text-slate-700 dark:text-slate-300",
                                line.value === 0 && "opacity-20"
                            )}>
                                ${line.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-emerald-50/30 dark:bg-emerald-950/20 border-t-2 border-slate-100 dark:border-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <p className="text-[10px] text-emerald-800/60 dark:text-emerald-400/60 leading-relaxed">
                            This preview is generated based on your categorized transactions. It is intended for tax planning purposes only and should be reviewed by a certified tax professional before filing.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
