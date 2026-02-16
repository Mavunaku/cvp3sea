'use client';

import { AssetTable } from '@/components/AssetTable';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, TrendingUp, Scale, Zap } from 'lucide-react';
import { useState } from 'react';

export default function AssetsPage() {
    const { assets, transactions, selectedProjectId } = useStore();
    const [showCostBasisInfo, setShowCostBasisInfo] = useState(false);
    const [showCurrentDeductionInfo, setShowCurrentDeductionInfo] = useState(false);
    const [showLifetimeSavingsInfo, setShowLifetimeSavingsInfo] = useState(false);

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
                    <Card className="bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900 shadow-sm relative">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">Total Cost Basis</CardTitle>
                                <button
                                    onClick={() => setShowCostBasisInfo(!showCostBasisInfo)}
                                    className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full transition-colors"
                                    title="Show calculation details"
                                >
                                    <Info className="h-3.5 w-3.5 text-indigo-600" />
                                </button>
                            </div>
                            <Scale className="h-4 w-4 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${Math.round(totalBasis).toLocaleString()}</div>
                            <p className="text-[10px] text-slate-500 mt-1">Total value of business investments</p>
                            {showCostBasisInfo && (
                                <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 text-xs space-y-1">
                                    <div className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">Calculation:</div>
                                    <div className="flex justify-between">
                                        <span>Sum of (Asset Cost × Business Use %)</span>
                                        <span className="font-mono">${Math.round(totalBasis).toLocaleString()}</span>
                                    </div>
                                    <div className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-2 italic">
                                        This is the depreciable basis for all your business assets
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 shadow-sm relative">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">2026 Tax Deduction</CardTitle>
                                <button
                                    onClick={() => setShowCurrentDeductionInfo(!showCurrentDeductionInfo)}
                                    className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-full transition-colors"
                                    title="Show calculation details"
                                >
                                    <Info className="h-3.5 w-3.5 text-emerald-600" />
                                </button>
                            </div>
                            <Zap className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${Math.round(currentDeduction).toLocaleString()}</div>
                            <p className="text-[10px] text-slate-500 mt-1">Amount lowering your taxes THIS year</p>
                            {showCurrentDeductionInfo && (
                                <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                                    <div className="font-bold text-emerald-900 dark:text-emerald-100 mb-2">Calculation:</div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-emerald-800 dark:text-emerald-200">For each asset:</div>
                                        <div className="pl-2 space-y-0.5 text-[10px]">
                                            <div>• Section 179: Full basis deduction</div>
                                            <div>• Bonus Depreciation: Full basis deduction</div>
                                            <div>• Regular: Basis ÷ Useful Life</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between border-t border-emerald-300 dark:border-emerald-700 pt-1 mt-1 font-bold">
                                        <span>Total 2026 Deduction:</span>
                                        <span className="font-mono">${Math.round(currentDeduction).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900 shadow-sm relative">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Lifetime Savings</CardTitle>
                                <button
                                    onClick={() => setShowLifetimeSavingsInfo(!showLifetimeSavingsInfo)}
                                    className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-full transition-colors"
                                    title="Show calculation details"
                                >
                                    <Info className="h-3.5 w-3.5 text-amber-600" />
                                </button>
                            </div>
                            <TrendingUp className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${Math.round(lifetimeSavings).toLocaleString()}</div>
                            <p className="text-[10px] text-slate-500 mt-1">Total write-offs claimed to date</p>
                            {showLifetimeSavingsInfo && (
                                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                                    <div className="font-bold text-amber-900 dark:text-amber-100 mb-2">Calculation:</div>
                                    <div className="flex justify-between">
                                        <span>Prior Depreciation:</span>
                                        <span className="font-mono">${Math.round(filteredAssets.reduce((acc, a) => acc + (a.priorDepreciation || 0), 0)).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>+ Current Year Deduction:</span>
                                        <span className="font-mono">${Math.round(currentDeduction).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-amber-300 dark:border-amber-700 pt-1 mt-1 font-bold">
                                        <span>= Lifetime Savings:</span>
                                        <span className="font-mono">${Math.round(lifetimeSavings).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
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
