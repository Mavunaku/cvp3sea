'use client';

import { useStore } from '@/store/useStore';
import { format } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, MoreHorizontal } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RecentActivity() {
    const { transactions, selectedYear, selectedProjectId, projects } = useStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const recentTransactions = useMemo(() => {
        // Filter first
        const filtered = transactions.filter(t => {
            if (selectedProjectId) return t.projectId === selectedProjectId;
            if (selectedYear) {
                const project = projects.find(p => p.id === t.projectId);
                return project?.yearId === selectedYear;
            }
            return true;
        });

        // Then Sort and Slice
        return [...filtered]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3);
    }, [transactions, selectedYear, selectedProjectId, projects]);

    if (!mounted) return null;

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                {recentTransactions.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        No transactions yet. Start adding income or expenses!
                    </div>
                ) : (
                    <div className="space-y-4">
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
                                    {t.type === 'income' ? '+' : '-'}${(t.amount || 0).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
