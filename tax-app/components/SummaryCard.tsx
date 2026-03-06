'use client';

import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

import { calculateStats } from '@/lib/calculations';

export function SummaryCard() {
    const { transactions, selectedYear, selectedProjectId, projects, assets } = useStore();

    const stats = useMemo(() => {
        return calculateStats(transactions, assets, projects, selectedYear, selectedProjectId);
    }, [transactions, assets, projects, selectedYear, selectedProjectId]);

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
                </CardContent>
            </Card>
        </div>
    );
}
