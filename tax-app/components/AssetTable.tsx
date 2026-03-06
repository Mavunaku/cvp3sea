'use client';

import { useStore } from '@/store/useStore';
import { Asset } from '@/types';
import { EditableCell } from './EditableCell';
import { Plus, Trash2, Info, Lightbulb, TrendingUp, Scale, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AssetTable() {
    const {
        assets,
        addAsset,
        editAsset,
        deleteAsset,
        transactions,
        selectedProjectId
    } = useStore();

    // 1. Filter Assets by Project (if selected)
    const filteredAssets = selectedProjectId
        ? assets.filter(a => a.projectId === selectedProjectId)
        : assets;

    // 2. Derive Capitalized Improvements from Transactions
    const capitalizedRepairs = transactions.filter(t =>
        t.capitalize === true &&
        (!selectedProjectId || t.projectId === selectedProjectId)
    );

    const handleAdd = () => {
        addAsset({
            name: 'New Asset',
            type: 'Office Furniture',
            purchaseDate: new Date().toISOString().split('T')[0],
            cost: 0,
            businessUsePercent: 100,
            usefulLife: 5,
            section179: false,
            bonusDepreciation: false,
            notes: '',
            projectId: selectedProjectId || undefined,
        });
    };

    const calculateDepreciationDetails = (asset: Asset) => {
        const cost = asset.cost || 0;
        const businessUse = asset.businessUsePercent / 100;
        const totalBasis = cost * businessUse;

        let currentDepreciation = 0;
        let specialAllowance = 0;
        let sec179 = 0;

        if (asset.currentDepreciation !== undefined) {
            currentDepreciation = asset.currentDepreciation;
        } else if (asset.section179) {
            sec179 = totalBasis;
            currentDepreciation = sec179;
        } else if (asset.bonusDepreciation) {
            specialAllowance = totalBasis;
            currentDepreciation = specialAllowance;
        } else {
            currentDepreciation = totalBasis / asset.usefulLife;
        }

        const prior = asset.priorDepreciation || 0;
        const roundedCurrentDepr = Math.round(currentDepreciation);
        const accumulated = prior + roundedCurrentDepr;
        const depreciableBasis = totalBasis;

        return {
            depreciableBasis,
            sec179,
            specialAllowance,
            currentDepreciation: roundedCurrentDepr,
            prior,
            accumulated
        };
    };

    const totalAssetCost = filteredAssets.reduce((acc, a) => acc + a.cost, 0);
    const totalAssetLand = filteredAssets.reduce((acc, a) => acc + (a.land || 0), 0);
    const assetStats = filteredAssets.map(calculateDepreciationDetails);
    const totalCurrentDepr = assetStats.reduce((acc, s) => acc + s.currentDepreciation, 0);
    const totalPriorDepr = assetStats.reduce((acc, s) => acc + s.prior, 0);
    const totalAccumDepr = assetStats.reduce((acc, s) => acc + s.accumulated, 0);

    const totalCapRepairsCost = capitalizedRepairs.reduce((acc, t) => acc + t.amount, 0);
    const totalCapRepairsDepreciation = capitalizedRepairs.reduce((acc, t) => acc + Math.round(t.amount / 27.5), 0);

    return (
        <div className="space-y-8">
            {/* NEW: Statistics Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400">Total 2026 Write-off</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                            ${(totalCurrentDepr + totalCapRepairsDepreciation).toLocaleString()}
                        </div>
                        <p className="text-[10px] text-emerald-600/70 font-medium mt-1">Combined Equipment + Improvements</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Asset Cost Basis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                            ${totalAssetCost.toLocaleString()}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Gross value of all equipment</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50/30 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Special Allowances</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 font-mono">
                            ${assetStats.reduce((acc, s) => acc + s.sec179 + s.specialAllowance, 0).toLocaleString()}
                        </div>
                        <p className="text-[10px] text-blue-500/70 font-medium mt-1">Accelerated Depreciation Used</p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50/30 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-amber-600">LTD Depreciation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono">
                            ${(totalAccumDepr + totalCapRepairsDepreciation).toLocaleString()}
                        </div>
                        <p className="text-[10px] text-amber-600/70 font-medium mt-1">Total Life-to-Date Write-offs</p>
                    </CardContent>
                </Card>
            </div>

            {/* SECTION 1: Fixed Assets */}
            <div className="space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <Zap className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">Fixed Asset Ledger</h2>
                            <p className="text-[11px] text-muted-foreground font-medium">Manage and track depreciation for business equipment.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={!selectedProjectId}
                        className="inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 bg-slate-900 text-white hover:bg-black h-11 px-6 border-b-4 border-slate-700 hover:border-slate-900"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Asset
                    </button>
                </div>

                <div className="rounded-md border bg-card shadow-sm overflow-hidden border-collapse">
                    <div className="w-full overflow-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-48">Asset Description</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-24 whitespace-nowrap">Service Date</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-24 text-right underline decoration-dotted cursor-help" title="Cost excluding land value">Cost (Net Land)</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-24 text-right">Land</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-16 text-center">Bus %</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-20 text-center flex items-center justify-center gap-1">
                                        Sec 179
                                        <Info className="h-3 w-3 text-slate-400" />
                                    </th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-24 text-center">Spec. Allow.</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-28 text-right">Basis</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-16 text-center">Life</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-24 text-center">Method</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-16 text-center">Conv.</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-24 text-right">Prior</th>
                                    <th className="p-2 font-bold text-emerald-700 bg-emerald-500/10 border-r w-24 text-right uppercase tracking-tighter">2026 Write-off</th>
                                    <th className="p-2 font-semibold text-muted-foreground w-24 text-right">Accumulated</th>
                                    <th className="p-2 font-semibold text-muted-foreground w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredAssets.length === 0 ? (
                                    <tr>
                                        <td colSpan={13} className="h-24 text-center text-muted-foreground italic">
                                            {selectedProjectId ? "No assets record for this context." : "Select a folder context to manage assets."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAssets.map((asset) => {
                                        const stats = calculateDepreciationDetails(asset);
                                        return (
                                            <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-2 border-r font-medium">
                                                    <EditableCell
                                                        value={asset.name}
                                                        onSave={(val) => editAsset(asset.id, { name: String(val) })}
                                                    />
                                                </td>
                                                <td className="p-2 border-r text-right italic font-mono">
                                                    <EditableCell
                                                        value={asset.purchaseDate}
                                                        type="date"
                                                        onSave={(val) => editAsset(asset.id, { purchaseDate: String(val) })}
                                                    />
                                                </td>
                                                <td className="p-2 border-r text-right font-mono">
                                                    <EditableCell
                                                        value={asset.cost}
                                                        type="number"
                                                        onSave={(val) => editAsset(asset.id, { cost: Number(val) })}
                                                    />
                                                </td>
                                                <td className="p-2 border-r text-right font-mono bg-muted/20">
                                                    <EditableCell
                                                        value={asset.land || 0}
                                                        type="number"
                                                        onSave={(val) => editAsset(asset.id, { land: Number(val) })}
                                                    />
                                                </td>
                                                <td className="p-2 border-r text-center font-mono">
                                                    <EditableCell
                                                        value={asset.businessUsePercent}
                                                        type="number"
                                                        onSave={(val) => editAsset(asset.id, { businessUsePercent: Number(val) })}
                                                    />
                                                </td>
                                                <td className="p-2 border-r text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={asset.section179}
                                                        onChange={(e) => editAsset(asset.id, { section179: e.target.checked })}
                                                        className="h-3 w-3"
                                                    />
                                                </td>
                                                <td className="p-2 border-r text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={asset.bonusDepreciation}
                                                        onChange={(e) => editAsset(asset.id, { bonusDepreciation: e.target.checked })}
                                                        className="h-3 w-3"
                                                    />
                                                </td>
                                                <td className="p-2 border-r text-right font-mono text-indigo-600 font-medium">
                                                    ${stats.depreciableBasis.toLocaleString()}
                                                </td>
                                                <td className="p-2 border-r text-center">
                                                    <select
                                                        value={asset.usefulLife}
                                                        onChange={(e) => editAsset(asset.id, { usefulLife: Number(e.target.value) as any })}
                                                        className="bg-transparent text-[10px] w-full text-center focus:outline-none"
                                                    >
                                                        <option value={3}>3</option>
                                                        <option value={5}>5</option>
                                                        <option value={7}>7</option>
                                                        <option value={15}>15</option>
                                                        <option value={27.5}>27.5</option>
                                                        <option value={39}>39</option>
                                                    </select>
                                                </td>
                                                <td className="p-2 border-r text-center">
                                                    <select
                                                        value={asset.method || 'MACRS'}
                                                        onChange={(e) => editAsset(asset.id, { method: e.target.value as any })}
                                                        className="bg-transparent text-[10px] w-full text-center focus:outline-none font-sans"
                                                    >
                                                        <option value="MACRS">MACRS</option>
                                                        <option value="Straight Line">S/L</option>
                                                        <option value="S/L (Mid-Mo)">S/L (MM)</option>
                                                        <option value="S/L (Half-Yr)">S/L (HY)</option>
                                                    </select>
                                                </td>
                                                <td className="p-2 border-r text-center">
                                                    <select
                                                        value={asset.convention || 'HY'}
                                                        onChange={(e) => editAsset(asset.id, { convention: e.target.value as any })}
                                                        className="bg-transparent text-[10px] w-full text-center focus:outline-none font-sans"
                                                    >
                                                        <option value="HY">HY</option>
                                                        <option value="MQ">MQ</option>
                                                        <option value="MM">MM</option>
                                                    </select>
                                                </td>
                                                <td className="p-2 border-r text-right font-mono bg-slate-50/50 dark:bg-slate-800/30">
                                                    <EditableCell
                                                        value={asset.priorDepreciation || 0}
                                                        type="number"
                                                        onSave={(val) => editAsset(asset.id, { priorDepreciation: Number(val) })}
                                                        className="text-slate-500"
                                                    />
                                                </td>
                                                <td className="p-2 border-r text-right font-mono text-emerald-700 font-black bg-emerald-500/10 ring-1 ring-emerald-500/20 shadow-inner">
                                                    <EditableCell
                                                        value={stats.currentDepreciation}
                                                        type="number"
                                                        onSave={(val) => editAsset(asset.id, { currentDepreciation: Number(val) })}
                                                        className="text-emerald-700 font-black"
                                                    />
                                                </td>
                                                <td className="p-2 border-r text-right font-mono bg-slate-100/50 dark:bg-slate-900/50 font-bold">
                                                    ${stats.accumulated.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </td>
                                                <td className="p-2 text-center text-muted-foreground bg-white dark:bg-slate-900">
                                                    <button onClick={() => deleteAsset(asset.id)} className="hover:text-destructive p-1 rounded-md hover:bg-rose-50 transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            <tfoot className="bg-slate-900 text-white font-bold border-t border-slate-700">
                                <tr>
                                    <td colSpan={2} className="p-3 text-right border-r border-slate-800 uppercase tracking-widest text-[10px]">Total Schedule</td>
                                    <td className="p-3 text-right border-r border-slate-800 font-mono text-indigo-300">${totalAssetCost.toLocaleString()}</td>
                                    <td className="p-3 text-right border-r border-slate-800 font-mono text-slate-400">${totalAssetLand.toLocaleString()}</td>
                                    <td colSpan={7} className="border-r border-slate-800"></td>
                                    <td className="p-3 text-right border-r border-slate-800 font-mono text-slate-400">${totalPriorDepr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="p-3 text-right border-r border-slate-800 font-mono text-emerald-400 bg-emerald-900/40">${totalCurrentDepr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="p-3 text-right border-r border-slate-800 font-mono text-slate-300 font-black">${totalAccumDepr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="bg-slate-900 border-l border-slate-800"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap className="h-12 w-12 text-emerald-600" />
                        </div>
                        <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            High Income Year? Use Sec 179
                        </h4>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-500 mt-2 leading-relaxed">
                            Section 179 allows you to &quot;fast-forward&quot; your deductions. Check the box to deduct the <span className="underline italic">full amount</span> this year instead of over 5-7 years. Best used in years where you need a massive tax shield.
                        </p>
                    </div>
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="h-12 w-12 text-indigo-600" />
                        </div>
                        <h4 className="text-sm font-bold text-indigo-800 dark:text-indigo-400 flex items-center gap-2">
                            <Scale className="h-4 w-4" />
                            Stable Growth? Use MACRS
                        </h4>
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-500 mt-2 leading-relaxed">
                            Standard depreciation (Don&apos;t check Sec 179) preserves deductions for the future. This is better if you expect your income to be significantly higher in the next 3-5 years.
                        </p>
                    </div>
                </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-800 w-full" />

            {/* SECTION 2: Capitalized Improvements (Read-Only from Transactions) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/30">
                            <Info className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">Property Improvements</h2>
                            <p className="text-[11px] text-amber-700/70 font-medium">Structural upgrades (HVAC, Roofs) - written off over 27.5 years.</p>
                        </div>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 px-4 py-1.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-2 shadow-sm">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest">Auto-Synced</span>
                    </div>
                </div>

                <div className="rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-white/50 dark:bg-slate-900/50 shadow-sm overflow-hidden">
                    <div className="w-full overflow-auto">
                        <table className="w-full caption-bottom text-xs border-collapse">
                            <thead>
                                <tr className="bg-amber-500/5 border-b border-amber-100/50">
                                    <th className="h-12 px-4 text-left align-middle font-bold text-slate-500 w-32 uppercase tracking-tighter">Date</th>
                                    <th className="h-12 px-4 text-left align-middle font-bold text-slate-500 uppercase tracking-tighter">Description/Vendor</th>
                                    <th className="h-12 px-4 text-right align-middle font-bold text-slate-500 w-28 uppercase tracking-tighter">Cost</th>
                                    <th className="h-12 px-4 text-center align-middle font-bold text-slate-500 w-24 uppercase tracking-tighter">Life</th>
                                    <th className="h-12 px-4 text-right align-middle font-black text-amber-600 w-32 uppercase tracking-tighter bg-amber-500/5 border-l border-amber-100/50">2026 Write-off</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100/30">
                                {capitalizedRepairs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="h-24 text-center text-muted-foreground italic">
                                            No capitalized repairs found for this project.
                                        </td>
                                    </tr>
                                ) : (
                                    capitalizedRepairs.map(t => (
                                        <tr key={t.id} className="hover:bg-amber-500/5 transition-colors">
                                            <td className="p-4 align-middle font-mono text-slate-500">{t.date}</td>
                                            <td className="p-4 align-middle font-medium text-slate-900 dark:text-slate-100">{t.description}</td>
                                            <td className="p-4 align-middle text-right font-mono text-slate-600">${t.amount.toLocaleString()}</td>
                                            <td className="p-4 align-middle text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                    27.5 Yrs
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-right font-mono text-amber-700 font-black bg-amber-500/10 ring-1 ring-amber-500/20 shadow-inner">
                                                ${(t.amount / 27.5).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="bg-amber-900 text-white font-bold border-t border-amber-800">
                                <tr>
                                    <td colSpan={2} className="p-4 text-right uppercase tracking-widest text-[10px]">Total Improvements</td>
                                    <td className="p-4 text-right font-mono text-amber-200">${totalCapRepairsCost.toLocaleString()}</td>
                                    <td className="p-4"></td>
                                    <td className="p-4 text-right font-mono text-amber-400 bg-amber-950/50 font-black">
                                        ${totalCapRepairsDepreciation.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            <p className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] text-muted-foreground italic flex items-center gap-2">
                <Info className="h-3 w-3 text-slate-400" />
                This is an estimate only. Depreciation rules vary significantly by asset type and usage. Always confirm your final depreciation strategy with a qualified tax professional.
            </p>
        </div>
    );
}
