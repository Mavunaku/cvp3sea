'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Printer, X, Download } from 'lucide-react';

interface AccountantReportProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AccountantReport({ isOpen, onClose }: AccountantReportProps) {
    const { transactions, assets, projects, selectedYear, selectedProjectId } = useStore();

    if (!isOpen) return null;

    // Filter Data based on selection
    const filteredTransactions = transactions.filter(t => {
        if (selectedProjectId) return t.projectId === selectedProjectId;
        if (selectedYear) {
            const project = projects.find(p => p.id === t.projectId);
            return project?.yearId === selectedYear;
        }
        return true;
    });

    const filteredAssets = assets.filter(a => {
        if (selectedProjectId) return a.projectId === selectedProjectId;
        if (selectedYear) {
            const project = projects.find(p => p.id === a.projectId);
            return project?.yearId === selectedYear;
        }
        return true;
    });

    const revenue = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const expenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    const deductibleExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
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
            if (t.capitalize) return acc;
            return acc + t.amount;
        }, 0);

    const totalDepreciation = filteredAssets.reduce((acc, asset) => {
        const cost = asset.cost || 0;
        const businessUse = (asset.businessUsePercent || 100) / 100;
        const basis = cost * businessUse;
        if (asset.currentDepreciation !== undefined) return acc + asset.currentDepreciation;
        if (asset.section179 || asset.bonusDepreciation) return acc + basis;

        const life = asset.usefulLife || 5;
        return acc + Math.round(basis / life);
    }, 0);

    const nySourceIncome = filteredTransactions
        .filter(t => t.type === 'income' && (t.nySource ?? true))
        .reduce((acc, t) => acc + t.amount, 0) - (deductibleExpenses + totalDepreciation);

    // Grouping by category/pillar for report
    const incomeByCategory = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((acc: any, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

    const expenseByPillar = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc: any, t) => {
            const pillar = t.pillar || 'Uncategorized';
            acc[pillar] = (acc[pillar] || 0) + t.amount;
            return acc;
        }, {});

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 print:p-0 print:bg-white print:backdrop-blur-none">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-white/20 flex flex-col print:shadow-none print:border-none print:max-h-none print:rounded-none">

                {/* Header - Hidden in Print */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                            <FileText className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Accountant Tax Report</h2>
                            <p className="text-sm text-slate-500">Selected: {selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : (selectedYear || 'All Time')}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400"
                            title="Print Report"
                        >
                            <Printer className="h-5 w-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div className="p-10 space-y-8 print:p-0">
                    <div className="text-center space-y-2 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <h1 className="text-3xl font-black tracking-tight uppercase">Tax Ledger Report</h1>
                        <p className="text-slate-500 font-medium tracking-widest">{selectedProjectId ? `Project: ${projects.find(p => p.id === selectedProjectId)?.name}` : `Tax Year: ${selectedYear || 'Comprehensive'}`}</p>
                        <p className="text-xs text-slate-400 pt-2 uppercase tracking-tighter">Generated on {new Date().toLocaleDateString()}</p>
                    </div>

                    {/* Summary Matrix */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest opacity-80">Gross Income</span>
                            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">${revenue.toLocaleString()}</div>
                        </div>
                        <div className="p-6 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest opacity-80">Total Deductible</span>
                                {expenses !== deductibleExpenses && (
                                    <span className="text-[9px] text-rose-400 font-medium italic">Gross: ${expenses.toLocaleString()}</span>
                                )}
                            </div>
                            <div className="text-2xl font-black text-rose-700 dark:text-rose-400">${deductibleExpenses.toLocaleString()}</div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 md:col-span-1 col-span-2">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-80">Taxable Net</span>
                                <span className="text-[9px] text-blue-500 font-bold uppercase">Incl. Depr.</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">${(revenue - deductibleExpenses - totalDepreciation).toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Section: Income Breakdown */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Income Breakdown</h3>
                        <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                            <table className="w-full text-sm">
                                <thead className="bg-emerald-50/30 dark:bg-emerald-900/5">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold text-slate-600">Category</th>
                                        <th className="px-4 py-3 text-right font-bold text-slate-600">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {Object.entries(incomeByCategory).map(([cat, amount]: any) => (
                                        <tr key={cat}>
                                            <td className="px-4 py-3">{cat}</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold">${amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {nySourceIncome > 0 && (
                                        <tr className="bg-blue-50/20">
                                            <td className="px-4 py-3 font-semibold text-blue-600 italic">Of which: NY Source Income</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">${nySourceIncome.toLocaleString()}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section: Expense Pillars */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest border-l-4 border-rose-500 pl-3">Expense Pillars (Schedule C/E)</h3>
                        <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                            <table className="w-full text-sm">
                                <thead className="bg-rose-50/30 dark:bg-rose-900/5">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold text-slate-600">Tax Pillar</th>
                                        <th className="px-4 py-3 text-right font-bold text-slate-600">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {Object.entries(expenseByPillar).map(([pillar, amount]: any) => (
                                        <tr key={pillar}>
                                            <td className="px-4 py-3">
                                                {pillar}
                                                {pillar === 'Travels' && <span className="text-[10px] text-blue-500 block">Note: Travel is 100% deductible. Meals are 50% deductible. Entertainment is non-deductible.</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold">
                                                {pillar === 'Travels' ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] opacity-60">Total: ${amount.toLocaleString()}</span>
                                                        <span className="text-blue-600">Deductible: ${(
                                                            filteredTransactions
                                                                .filter(t => t.pillar === 'Travels')
                                                                .reduce((acc, t) => {
                                                                    if (t.category.includes('(50% Deductible)')) return acc + (t.amount * 0.5);
                                                                    if (t.category === 'Entertainment (Non-Deductible)') return acc;
                                                                    return acc + t.amount;
                                                                }, 0)
                                                        ).toLocaleString()}</span>
                                                    </div>
                                                ) : (
                                                    `$${amount.toLocaleString()}`
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex justify-between uppercase font-medium">
                        <span>Tax Ledger - Administrative Portal</span>
                        <span>Proprietary and Confidential</span>
                        <span>Page 1 of 1</span>
                    </div>
                </div>

                {/* Footer Action - Hidden in Print */}
                <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 print:hidden">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-6 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-black transition-all flex items-center gap-2"
                    >
                        <Printer className="h-4 w-4" />
                        Print to PDF
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        padding: 0 !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:p-0 {
                        padding: 0 !important;
                    }
                    .print\\:bg-white {
                        background: white !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:border-none {
                        border: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
