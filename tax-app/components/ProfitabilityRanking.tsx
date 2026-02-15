'use client';

import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function ProfitabilityRanking() {
    const { transactions, projects, selectedYear, selectedProjectId } = useStore();

    // If a project is selected, maybe show Top Categories instead?
    // For now, let's keep it simple. If project selected, hide this or show categories.
    // User request: "Profitability Ranking: Create a 'Top Performers' list that ranks projects"
    // Implicitly this is a Global/Year view component.

    if (selectedProjectId) {
        // Show Top Expense Categories for this project
        const pTrans = transactions.filter(t => t.projectId === selectedProjectId && t.type === 'expense');
        const categoryTotals = pTrans.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

        const sortedCats = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Top Expenses</CardTitle>
                    <CardDescription>Highest spending categories</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {sortedCats.map(([cat, amount], i) => (
                            <div key={cat} className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{cat}</p>
                                    <p className="text-xs text-muted-foreground">
                                        ${amount.toLocaleString()}
                                    </p>
                                </div>
                                <div className="ml-auto font-medium text-amber-600">
                                    #{i + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const relevantProjects = selectedYear
        ? projects.filter(p => p.yearId === selectedYear)
        : projects;

    const rankings = relevantProjects.map(p => {
        const pTrans = transactions.filter(t => t.projectId === p.id);
        const income = pTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = pTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const net = income - expense;
        const margin = income > 0 ? (net / income) * 100 : 0;

        return {
            id: p.id,
            name: p.name,
            type: p.type,
            income,
            net,
            margin
        };
    })
        .filter(p => p.income > 0) // Only rank revenue-generating projects
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 3);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Ranked by Profit Margin</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {rankings.map((project, index) => (
                        <div key={project.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ring-2",
                                    index === 0 ? "bg-yellow-100 text-yellow-700 ring-yellow-500/20" :
                                        index === 1 ? "bg-slate-100 text-slate-700 ring-slate-500/20" :
                                            index === 2 ? "bg-orange-100 text-orange-700 ring-orange-500/20" :
                                                "bg-muted text-muted-foreground ring-transparent"
                                )}>
                                    {index + 1}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{project.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Net: ${project.net.toLocaleString()} • Rev: ${project.income.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-0">
                                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Margin</span>
                                <span className={cn(
                                    "text-sm font-bold",
                                    project.margin >= 50 ? "text-emerald-600" :
                                        project.margin >= 20 ? "text-amber-600" : "text-rose-600"
                                )}>
                                    {project.margin.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    ))}
                    {rankings.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            No revenue data to rank.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
