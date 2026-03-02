'use client';

import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export function SummaryCard() {
    const { transactions, selectedYear, selectedProjectId, projects, assets } = useStore();

    const stats = useMemo(() => {
        const filteredTransactions = transactions.filter(t => {
            if (selectedProjectId) return t.projectId === selectedProjectId;
            if (selectedYear) {
                const project = projects.find(p => p.id === t.projectId);
                return project?.yearId === selectedYear || t.date.startsWith(selectedYear);
            }
            return true;
        });

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
                    if (t.interest !== undefined) return acc + (t.interest || 0);
                    if (t.category === 'Loan Principal') return acc;
                    return acc + amount;
                }
                if (t.pillar === 'Travels') {
                    if (t.category.includes('(50% Deductible)')) return acc + (amount * 0.5);
                    if (t.category === 'Entertainment (Non-Deductible)') return acc;
                    return acc + amount;
                }
                if (t.capitalize) return acc;
                return acc + amount;
            }, 0);

        const nySourceRevenue = filteredTransactions
            .filter(t => t.type === 'income' && (t.nySource ?? true))
            .reduce((acc, t) => acc + (t.amount || 0), 0);

        const nySourceExpenses = filteredTransactions
            .filter(t => t.type === 'expense' && (t.nySource ?? true))
            .reduce((acc, t) => acc + (t.amount || 0), 0);

        const nySourceIncome = nySourceRevenue - nySourceExpenses;

        const netProfit = revenue - expenses;

        return { revenue, expenses, deductibleExpenses, netProfit, nySourceIncome, nySourceRevenue, nySourceExpenses };
    }, [transactions, selectedYear, selectedProjectId, projects]);

    return (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-emerald-50/10 border-emerald-100/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gross Income</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600 font-mono">
                        ${(stats.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-rose-50/10 border-rose-100/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Your Write-offs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-rose-600 font-mono">
                        ${(stats.deductibleExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[10px] text-muted-foreground opacity-70 italic mt-1">
                        Gross: ${(stats.expenses || 0).toLocaleString()}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-900 leading-tight">Profit after Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold font-mono", stats.netProfit >= 0 ? "text-slate-900 dark:text-slate-100" : "text-rose-600")}>
                        ${(stats.netProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                <CardHeader className="flex flex-col space-y-0 pb-2">
                    <CardTitle className="text-sm font-bold text-emerald-900 dark:text-emerald-300">NY Net Taxable Profit</CardTitle>
                    <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 leading-tight italic">
                        Income - Expenses reported to NY State
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                        ${(stats.nySourceIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex gap-2 mt-1 opacity-60 text-[9px] font-bold uppercase tracking-tighter text-emerald-800 dark:text-emerald-400">
                        <span>Inc: ${(stats.nySourceRevenue || 0).toLocaleString()}</span>
                        <span>-</span>
                        <span>Exp: ${(stats.nySourceExpenses || 0).toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
