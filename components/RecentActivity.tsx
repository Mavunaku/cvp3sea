'use client';

import { useStore } from '@/store/useStore';
import { format } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, MoreHorizontal } from 'lucide-react';

export function RecentActivity() {
    const transactions = useStore((state) => state.transactions);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const recentTransactions = useMemo(() => {
        return [...transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [transactions]);

    if (!mounted) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6 pt-0">
                    {recentTransactions.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            No transactions yet. Start adding income or expenses!
                        </div>
                    ) : (
                        <div className="space-y-4 pt-6">
                            {recentTransactions.map((t) => (
                                <div key={t.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className={`rounded-full p-2 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {t.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{t.description || t.category}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{format(new Date(t.date), 'MMM d, yyyy')}</span>
                                                <span>•</span>
                                                <span>{t.entity}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
