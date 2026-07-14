'use client';

import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Transaction } from '@/types';

import {
    calculateStats,
    filterTransactions,
    filterAssets,
    getTransactionDeductibleAmount,
    isRentalProject,
    isCashSettled,
} from '@/lib/calculations';
import { calculateYearlyDepreciation } from '@/lib/depreciation';

interface PropertyColumn {
    projectId: string | null;
    name: string;
    grossRents: number;
    advertising: number;
    autoTravel: number;
    cleaningMaintenance: number;
    insurance: number;
    legalProfessional: number;
    mortgageInterest: number;
    repairs: number;
    taxes: number;
    utilities: number;
    wagesSalaries: number;
    depreciation: number;
    otherExpenses: number;
    totalExpenses: number;
    netIncome: number;
}

const EXPENSE_LINES: { key: keyof PropertyColumn; label: string }[] = [
    { key: 'advertising', label: '5. Advertising' },
    { key: 'autoTravel', label: '6. Auto and travel' },
    { key: 'cleaningMaintenance', label: '7. Cleaning and maintenance' },
    { key: 'insurance', label: '9. Insurance' },
    { key: 'legalProfessional', label: '10. Legal and other professional fees' },
    { key: 'mortgageInterest', label: '12. Mortgage interest paid to banks' },
    { key: 'repairs', label: '14. Repairs' },
    { key: 'taxes', label: '16. Taxes' },
    { key: 'utilities', label: '17. Utilities' },
    { key: 'wagesSalaries', label: '8. Wages and salaries' },
    { key: 'depreciation', label: '18. Depreciation expense' },
    { key: 'otherExpenses', label: '19. Other' },
];

export function ScheduleEPreview() {
    const { transactions, selectedYear, selectedProjectId, projects, assets } = useStore();

    const stats = useMemo(() => {
        return calculateStats(transactions, assets, projects, selectedYear, selectedProjectId);
    }, [transactions, assets, projects, selectedYear, selectedProjectId]);

    const { columns, totals } = useMemo(() => {
        const taxYear = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();
        const filteredTransactions = filterTransactions(transactions, projects, selectedYear, selectedProjectId)
            .filter(isCashSettled)
            .filter(t => isRentalProject(t.projectId, projects));
        const filteredAssets = filterAssets(assets, projects, selectedYear, selectedProjectId)
            .filter(a => isRentalProject(a.projectId, projects));

        const rentalProjects = projects.filter(p =>
            (p.type ?? 'Property') === 'Property' &&
            (!selectedProjectId || p.id === selectedProjectId) &&
            (!selectedYear || p.yearId === selectedYear)
        );

        // Transactions/assets with no matching rental project still need a home
        // ("Unassigned") so nothing silently disappears from the totals.
        const knownIds = new Set(rentalProjects.map(p => p.id));
        const hasUnassigned = filteredTransactions.some(t => !t.projectId || !knownIds.has(t.projectId)) ||
            filteredAssets.some(a => !a.projectId || !knownIds.has(a.projectId));

        const propertyList: { id: string | null; name: string }[] = rentalProjects.map(p => ({ id: p.id, name: p.name }));
        if (hasUnassigned) propertyList.push({ id: null, name: 'Unassigned' });

        const getSum = (txns: Transaction[], pill: string, cat?: string) =>
            txns
                .filter(t => {
                    if (t.pillar !== pill) return false;
                    if (cat) return t.category === cat;
                    return true;
                })
                .reduce((acc, t) => acc + getTransactionDeductibleAmount(t), 0);

        const columns: PropertyColumn[] = propertyList.map(({ id, name }) => {
            const txns = filteredTransactions.filter(t =>
                id === null ? (!t.projectId || !knownIds.has(t.projectId)) : t.projectId === id
            );
            const propAssets = filteredAssets.filter(a =>
                id === null ? (!a.projectId || !knownIds.has(a.projectId)) : a.projectId === id
            );

            const grossRents = txns.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || 0), 0);
            const advertising = getSum(txns, 'General Business', 'Advertising');
            const legalProfessional = getSum(txns, 'General Business', 'Legal/Professional Fees');
            const wagesSalaries = getSum(txns, 'General Business', 'Wages/Salaries');
            const insurance = getSum(txns, 'General Business', 'Insurance');
            const mortgageInterest = getSum(txns, 'Interest Expense');
            const taxes = getSum(txns, 'Taxes Paid');
            const utilities = getSum(txns, 'Utilities');
            const autoTravel = txns
                .filter(t => t.pillar === 'Travels' && t.category === 'Auto & Travel')
                .reduce((acc, t) => acc + getTransactionDeductibleAmount(t), 0);
            const cleaningMaintenance = txns
                .filter(t => t.pillar === 'Repairs' && (t.category === 'Cleaning' || t.category === 'Landscaping'))
                .reduce((acc, t) => acc + getTransactionDeductibleAmount(t), 0);
            const repairs = txns
                .filter(t => t.pillar === 'Repairs' && t.category !== 'Cleaning' && t.category !== 'Landscaping')
                .reduce((acc, t) => acc + getTransactionDeductibleAmount(t), 0);
            const otherExpenses = txns
                .filter(t => {
                    if (t.type !== 'expense') return false;
                    const knownPillars = ['General Business', 'Interest Expense', 'Repairs', 'Utilities', 'Travels', 'Taxes Paid'];
                    return !knownPillars.includes(t.pillar || '');
                })
                .reduce((acc, t) => acc + getTransactionDeductibleAmount(t), 0);

            const depreciation = propAssets.reduce((acc, a) => acc + calculateYearlyDepreciation(a, taxYear).amount, 0)
                + txns
                    .filter(t => t.capitalize === true)
                    .reduce((acc, t) => acc + Math.round((t.amount || 0) / (t.capitalizeLife || 27.5)), 0);

            const totalExpenses = advertising + autoTravel + cleaningMaintenance + insurance + legalProfessional
                + mortgageInterest + repairs + taxes + utilities + wagesSalaries + depreciation + otherExpenses;
            const netIncome = grossRents - totalExpenses;

            return {
                projectId: id,
                name,
                grossRents,
                advertising,
                autoTravel,
                cleaningMaintenance,
                insurance,
                legalProfessional,
                mortgageInterest,
                repairs,
                taxes,
                utilities,
                wagesSalaries,
                depreciation,
                otherExpenses,
                totalExpenses,
                netIncome,
            };
        });

        const totals = columns.reduce((acc, c) => {
            (Object.keys(acc) as (keyof PropertyColumn)[]).forEach(k => {
                if (k === 'name' || k === 'projectId') return;
                (acc[k] as number) += (c[k] as number);
            });
            return acc;
        }, {
            projectId: null, name: 'Total', grossRents: 0, advertising: 0, autoTravel: 0, cleaningMaintenance: 0,
            insurance: 0, legalProfessional: 0, mortgageInterest: 0, repairs: 0, taxes: 0, utilities: 0,
            wagesSalaries: 0, depreciation: 0, otherExpenses: 0, totalExpenses: 0, netIncome: 0,
        } as PropertyColumn);

        return { columns, totals };
    }, [transactions, assets, projects, selectedYear, selectedProjectId]);

    const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <Card className="max-w-5xl mx-auto bg-white dark:bg-slate-950 border-double border-4 border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b bg-slate-50 dark:bg-slate-900/50">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tighter uppercase">Form 8825 / Schedule E</CardTitle>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Rental Real Estate Income and Expenses</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold">{selectedYear || 'All Time'}</div>
                        <p className="text-[8px] text-muted-foreground uppercase">Estimated Preview Only</p>
                    </div>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-3 leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-3">
                    This is for <strong>rent collected from properties you own</strong>. Net income here is <strong>passive</strong> — no self-employment tax applies, even though you actively manage the property. Active business work does not belong here — see Schedule C instead. Only transactions tagged to a &quot;Property&quot; project are included, one column per property.
                </p>
            </CardHeader>
            <CardContent className="p-0">
                {columns.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        No rental properties found for this selection.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50/50 dark:bg-slate-900/20">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-slate-600 whitespace-nowrap">Line Item</th>
                                    {columns.map(c => (
                                        <th key={c.projectId ?? 'unassigned'} className="px-4 py-3 text-right font-bold text-slate-600 whitespace-nowrap">
                                            {c.name}
                                        </th>
                                    ))}
                                    {columns.length > 1 && (
                                        <th className="px-4 py-3 text-right font-black text-slate-800 whitespace-nowrap">Total</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                                <tr className="bg-emerald-50/20 dark:bg-emerald-900/10">
                                    <td className="px-4 py-3 font-bold">2. Gross rents received</td>
                                    {columns.map(c => (
                                        <td key={c.projectId ?? 'unassigned'} className="px-4 py-3 text-right font-mono font-bold">{fmt(c.grossRents)}</td>
                                    ))}
                                    {columns.length > 1 && <td className="px-4 py-3 text-right font-mono font-black">{fmt(totals.grossRents)}</td>}
                                </tr>
                                {EXPENSE_LINES.map(({ key, label }) => (
                                    <tr key={key}>
                                        <td className="px-4 py-3 pl-8 text-slate-600 dark:text-slate-400">{label}</td>
                                        {columns.map(c => (
                                            <td key={c.projectId ?? 'unassigned'} className={cn("px-4 py-3 text-right font-mono", (c[key] as number) === 0 && "opacity-20")}>
                                                {fmt(c[key] as number)}
                                            </td>
                                        ))}
                                        {columns.length > 1 && (
                                            <td className={cn("px-4 py-3 text-right font-mono font-bold", (totals[key] as number) === 0 && "opacity-20")}>
                                                {fmt(totals[key] as number)}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                <tr className="bg-slate-50/30 dark:bg-slate-900/20">
                                    <td className="px-4 py-3 font-bold">20. Total expenses</td>
                                    {columns.map(c => (
                                        <td key={c.projectId ?? 'unassigned'} className="px-4 py-3 text-right font-mono font-bold">{fmt(c.totalExpenses)}</td>
                                    ))}
                                    {columns.length > 1 && <td className="px-4 py-3 text-right font-mono font-black">{fmt(totals.totalExpenses)}</td>}
                                </tr>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                                    <td className="px-4 py-3 font-black">21. Net income or (loss)</td>
                                    {columns.map(c => (
                                        <td key={c.projectId ?? 'unassigned'} className={cn("px-4 py-3 text-right font-mono font-black", c.netIncome < 0 && "text-rose-600")}>
                                            {fmt(c.netIncome)}
                                        </td>
                                    ))}
                                    {columns.length > 1 && (
                                        <td className={cn("px-4 py-3 text-right font-mono font-black", totals.netIncome < 0 && "text-rose-600")}>
                                            {fmt(totals.netIncome)}
                                        </td>
                                    )}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
                {stats.passiveLossAllowanceNote && (
                    <div className="p-4 mx-4 mb-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                        <p className="text-[10px] text-amber-800/70 dark:text-amber-400/70 leading-relaxed">
                            {stats.passiveLossAllowanceNote}
                        </p>
                    </div>
                )}
                <div className="p-6 bg-emerald-50/30 dark:bg-emerald-950/20 border-t-2 border-slate-100 dark:border-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <p className="text-[10px] text-emerald-800/60 dark:text-emerald-400/60 leading-relaxed">
                            Net income here flows to Schedule E Part I (or Form 1065, if this entity has multiple K-1 members) and is not subject to self-employment tax. This preview is for planning only and should be reviewed by a certified tax professional before filing.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
