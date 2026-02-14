'use client';

import { useStore } from '@/store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AnalyticsCharts() {
    const { transactions, projects, selectedYear } = useStore();

    // 1. Prepare Data: aggregate by Project
    // If a year is selected, only show projects from that year?
    // User asked for: "Global Performance Analytics Dashboard that aggregates data across all Folders and Projects"
    // BUT "When I select a specific project ... filter to show only that project's data".
    // So:
    // - If Global: Show all projects (maybe filtered by selectedYear if set, or all years?) 
    //   -> Let's show all projects in the selected year, or all if no year.
    // - If Project Selected: Show only that project (single bar group? or breakdown by category?)
    //   -> User said "Project Comparison Chart". If one project selected, comparison is moot. 
    //   -> Maybe show Monthly breakdown for that project?

    // Strategy:
    // Global View -> Compare Projects.
    // Project View -> Monthly Trend.

    const { selectedProjectId } = useStore();

    if (selectedProjectId) {
        // Single Project View: Monthly Trend
        const projectTransactions = transactions.filter(t => t.projectId === selectedProjectId);
        // Group by Month (YYYY-MM)
        const monthlyData = projectTransactions.reduce((acc, t) => {
            const month = t.date.substring(0, 7); // "2025-01"
            if (!acc[month]) acc[month] = { name: month, Income: 0, Expenses: 0, Net: 0 };

            if (t.type === 'income') acc[month].Income += t.amount;
            else acc[month].Expenses += t.amount;

            acc[month].Net = acc[month].Income - acc[month].Expenses;
            return acc;
        }, {} as Record<string, any>);

        const data = Object.values(monthlyData).sort((a: any, b: any) => a.name.localeCompare(b.name));

        return (
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '6px' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Legend />
                                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Net" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Global View: Compare Projects
    const relevantProjects = selectedYear
        ? projects.filter(p => p.yearId === selectedYear)
        : projects;

    const projectData = relevantProjects.map(p => {
        const pTrans = transactions.filter(t => t.projectId === p.id);
        const income = pTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = pTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return {
            name: p.name,
            Income: income,
            Expenses: expense,
            Net: income - expense
        };
    }).filter(d => d.Income > 0 || d.Expenses > 0); // Hide empty projects

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Project Comparison {selectedYear ? `(${selectedYear})` : "(All Years)"}</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projectData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '6px' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Legend />
                            <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Net" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
