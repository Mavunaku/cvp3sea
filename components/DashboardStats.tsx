'use client';

import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';

export function DashboardStats() {
    const transactions = useStore((state) => state.transactions);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const stats = useMemo(() => {
        const revenue = transactions
            .filter((t) => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);
        const expenses = transactions
            .filter((t) => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);
        const netProfit = revenue - expenses;
        const taxLiability = netProfit > 0 ? netProfit * (0.153 + 0.25) : 0; // 15.3% SE + 25% Est. Fed/State

        return { revenue, expenses, netProfit, taxLiability };
    }, [transactions]);

    if (!mounted) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded-lg bg-sage-100 dark:bg-sage-800/50" />
            ))}
        </div>;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                        ${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Gross income (Schedule C + E)
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <TrendingDown className="h-4 w-4 text-rose-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                        ${stats.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Deductible business expenses
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <DollarSign className="h-4 w-4 text-sage-600" />
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold", stats.netProfit >= 0 ? "text-sage-900 dark:text-sage-100" : "text-rose-600")}>
                        ${stats.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Revenue - Expenses
                    </p>
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
                    <p className="text-xs text-muted-foreground">
                        ~40.3% of Net (SE + Fed/State)
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

function cn(classes: string, condition?: string) {
    // minimalist inline cn for now since I can't import easily inside this specific block without context, 
    // actually I can import it. I'll use the imported one.
    return classes + (condition ? " " + condition : "");
}
