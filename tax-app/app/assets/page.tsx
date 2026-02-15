'use client';

import { AssetTable } from '@/components/AssetTable';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, TrendingUp, Scale, Zap } from 'lucide-react';

export default function AssetsPage() {
    const { assets, transactions, selectedProjectId } = useStore();

    const filteredAssets = selectedProjectId
        ? assets.filter(a => a.projectId === selectedProjectId)
        : assets;

    const totalBasis = filteredAssets.reduce((acc, a) => acc + (a.cost * (a.businessUsePercent / 100)), 0);

    // Simplified current deduction calculation for summary
    const currentDeduction = filteredAssets.reduce((acc, a) => {
        const basis = a.cost * (a.businessUsePercent / 100);
        if (a.currentDepreciation !== undefined) return acc + a.currentDepreciation;
        if (a.section179) return acc + basis;
        if (a.bonusDepreciation) return acc + basis;
        return acc + (basis / (a.usefulLife || 5));
    }, 0);

    const lifetimeSavings = filteredAssets.reduce((acc, a) => acc + (a.priorDepreciation || 0), 0) + currentDeduction;

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 pb-20">
            <Breadcrumbs />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 italic">
                        Deduction Strategy Center
                    </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">Total Cost Basis</CardTitle>
                            <Scale className="h-4 w-4 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${Math.round(totalBasis).toLocaleString()}</div>
                            <p className="text-[10px] text-slate-500 mt-1">Total value of business investments</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">2026 Tax Deduction</CardTitle>
                            <Zap className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${Math.round(currentDeduction).toLocaleString()}</div>
                            <p className="text-[10px] text-slate-500 mt-1">Amount lowering your taxes THIS year</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Lifetime Savings</CardTitle>
                            <TrendingUp className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${Math.round(lifetimeSavings).toLocaleString()}</div>
                            <p className="text-[10px] text-slate-500 mt-1">Total write-offs claimed to date</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-4 items-start">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <Info className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold">Depreciation Intelligence</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            Think of depreciation as a way to &quot;slow-release&quot; the expense of a large purchase. Instead of taking a huge loss one year, you smooth it out over the item&apos;s life.
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 italic"> Strategy Tip:</span> Use Sec 179 for a full write-off today if you need to offset a high income burst.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <AssetTable />
            </div>
        </div>
    );
}
 
