'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/store/useStore';

export function AnalyticsCharts() {
    const { transactions, projects, selectedYear, selectedProjectId } = useStore();

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

    if (selectedProjectId) {
        // Single Project View: Monthly Trend
        const projectTransactions = transactions.filter((t: any) => t.projectId === selectedProjectId);
        const monthlyData = projectTransactions.reduce((acc: any, t: any) => {
            const month = t.date.substring(0, 7); // "2025-01"
            if (!acc[month]) acc[month] = { name: month, Income: 0, Expenses: 0, Net: 0 };

            if (t.type === 'income') acc[month].Income += t.amount;
            else acc[month].Expenses += t.amount;

            acc[month].Net = acc[month].Income - acc[month].Expenses;
            return acc;
        }, {} as Record<string, any>);

        const data = Object.values(monthlyData).sort((a: any, b: any) => a.name.localeCompare(b.name));

        return (
            <Card className="col-span-4 border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="text-lg font-bold tracking-tight">Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent className="pl-2 flex-1 min-h-[350px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
                            <XAxis
                                dataKey="name"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => {
                                    const d = new Date(val + "-01");
                                    return d.toLocaleDateString('en-US', { month: 'short' });
                                }}
                            />
                            <YAxis
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                    borderColor: '#e2e8f0',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                }}
                                formatter={(value: any) => [formatCurrency(value), ""]}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                            <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Net" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    }

    // Global View: Compare Projects
    const relevantProjects = selectedYear
        ? projects.filter((p: any) => p.yearId === selectedYear)
        : projects;

    const projectData = relevantProjects.map((p: any) => {
        const pTrans = transactions.filter((t: any) => t.projectId === p.id);
        const income = pTrans.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + t.amount, 0);
        const expense = pTrans.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + t.amount, 0);
        return {
            name: p.name,
            Income: income,
            Expenses: expense,
            Net: income - expense
        };
    }).filter((d: any) => d.Income > 0 || d.Expenses > 0);

    return (
        <Card className="col-span-4 border-indigo-100 dark:border-indigo-900 shadow-md h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg font-bold tracking-tight text-indigo-900 dark:text-indigo-400">
                    Project Comparison {selectedYear ? `(${selectedYear})` : "(All Years)"}
                </CardTitle>
            </CardHeader>
            <CardContent className="pl-2 flex-1 min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={projectData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                borderColor: '#e2e8f0',
                                borderRadius: '12px',
                                fontSize: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: any) => [formatCurrency(value), ""]}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                        <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Net" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
