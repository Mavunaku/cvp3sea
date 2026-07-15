'use client';

import { useStore } from '@/store/useStore';
import { EditableCell } from './EditableCell';
import { calculateDisposition, calculateDispositions, calculateAccumulatedDepreciation, filterAssets } from '@/lib/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Info, TrendingUp, TrendingDown, Home, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const fmt = (n: number) =>
    `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;

export function DispositionTable() {
    const { assets, addAsset, editAsset, deleteAsset, projects, selectedProjectId, selectedYear } = useStore();

    const filteredAssets = filterAssets(assets, projects, selectedYear, selectedProjectId);

    const summary = calculateDispositions(filteredAssets);
    const yearLabel = selectedYear || 'this year';

    const markSold = (id: string) =>
        editAsset(id, { saleDate: `${selectedYear || new Date().getFullYear()}-01-01`, salePrice: 0, sellingCosts: 0 });
    const markHeld = (id: string) =>
        editAsset(id, { saleDate: undefined, salePrice: undefined, sellingCosts: undefined });

    const handleAddProperty = () => {
        // Attach to the selected property folder, or the first one in the year.
        let projectId = selectedProjectId || undefined;
        if (!projectId) {
            const yearProjects = projects.filter(p => p.yearId === selectedYear);
            if (yearProjects.length > 0) projectId = yearProjects[0].id;
        }
        addAsset({
            name: 'New Property',
            type: 'Property Improvement',
            purchaseDate: new Date().toISOString().split('T')[0],
            cost: 0,
            land: 0,
            businessUsePercent: 100,
            usefulLife: 27.5, // building default — marks it as real property
            section179: false,
            bonusDepreciation: false,
            priorDepreciation: 0,
            notes: '',
            projectId,
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-purple-100 dark:border-purple-900/30">
                        <Landmark className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">Properties &amp; Sales — {yearLabel}</h2>
                        <p className="text-[11px] text-purple-700/70 dark:text-purple-400/70 font-medium">Track each property you own (as many as you like), enter its values, and flip it to &quot;Sold&quot; the year you sell to see the capital gain (Form 4797).</p>
                    </div>
                </div>
                <button
                    onClick={handleAddProperty}
                    className="inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 bg-purple-600 text-white hover:bg-purple-700 h-11 px-6"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Property
                </button>
            </div>

            <div className="space-y-3">
                {filteredAssets.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-muted-foreground italic">
                        No properties tracked yet. Click &quot;Add Property&quot; to add your first one — you can add as many as you own.
                    </div>
                ) : (
                    filteredAssets.map(asset => {
                        const d = calculateDisposition(asset);
                        const isSold = !!d;
                        const accumDepr = calculateAccumulatedDepreciation(asset, selectedYear ? parseInt(selectedYear, 10) : undefined);
                        return (
                            <div key={asset.id} className={cn(
                                "rounded-2xl border p-4 transition-colors",
                                isSold ? "border-purple-200 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-900/10" : "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40"
                            )}>
                                {/* Header row: editable name + Held/Sold toggle + delete */}
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div className="flex-1 min-w-[220px]">
                                        <EditableCell
                                            value={asset.name}
                                            onSave={(val) => editAsset(asset.id, { name: String(val) })}
                                            className="font-bold text-slate-900 dark:text-slate-100 text-base"
                                        />
                                        <div className="text-[10px] uppercase tracking-tight text-slate-400 px-2">
                                            {(asset.usefulLife || 0) >= 27.5 ? 'Real property (building)' : 'Personal property (equipment)'} · Depreciation taken to date: {fmt(accumDepr)}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="inline-flex rounded-full border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900">
                                            <button
                                                onClick={() => markHeld(asset.id)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all",
                                                    !isSold ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                                                )}
                                            >
                                                <Home className="h-3.5 w-3.5" /> Still Owned
                                            </button>
                                            <button
                                                onClick={() => { if (!isSold) markSold(asset.id); }}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all",
                                                    isSold ? "bg-purple-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                                                )}
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Sold
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Remove "${asset.name}" from tracking? This deletes its depreciation history too.`)) deleteAsset(asset.id);
                                            }}
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                            title="Remove property"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Property values — always editable */}
                                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <label className="block">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Purchase Date</span>
                                        <EditableCell
                                            value={asset.purchaseDate}
                                            type="date"
                                            onSave={(val) => editAsset(asset.id, { purchaseDate: String(val) })}
                                            className="mt-1 border border-slate-200 dark:border-slate-700 rounded-lg"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Building Cost (No Land)</span>
                                        <EditableCell
                                            value={asset.cost}
                                            type="number"
                                            onSave={(val) => editAsset(asset.id, { cost: Number.isFinite(Number(val)) ? Number(val) : 0 })}
                                            className="mt-1 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">What you paid for the building itself, excluding land.</p>
                                    </label>
                                    <label className="block">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Land Value</span>
                                        <EditableCell
                                            value={asset.land || 0}
                                            type="number"
                                            onSave={(val) => editAsset(asset.id, { land: Number.isFinite(Number(val)) ? Number(val) : 0 })}
                                            className="mt-1 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">Not depreciable, but still counts toward your basis when you sell.</p>
                                    </label>
                                    <label className="block">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Prior Depreciation</span>
                                        <EditableCell
                                            value={asset.priorDepreciation || 0}
                                            type="number"
                                            onSave={(val) => editAsset(asset.id, { priorDepreciation: Number.isFinite(Number(val)) ? Number(val) : 0 })}
                                            className="mt-1 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">Depreciation already claimed in years before this app tracked it. Leave at $0 if this app has tracked it from day one.</p>
                                    </label>
                                </div>

                                {/* Sale details — only when sold */}
                                {isSold && (
                                    <div className="mt-4 pt-4 border-t border-purple-100/60 dark:border-purple-900/30">
                                        <div className="grid gap-4 sm:grid-cols-3 mb-4">
                                            <label className="block">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sale Date</span>
                                                <EditableCell
                                                    value={asset.saleDate || ''}
                                                    type="date"
                                                    onSave={(val) => editAsset(asset.id, { saleDate: String(val) || undefined })}
                                                    className="mt-1 border border-slate-200 dark:border-slate-700 rounded-lg"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1 leading-snug">The closing date &mdash; sets which year's return this sale is reported on.</p>
                                            </label>
                                            <label className="block">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sale Price</span>
                                                <EditableCell
                                                    value={asset.salePrice ?? ''}
                                                    type="number"
                                                    onSave={(val) => editAsset(asset.id, { salePrice: Number.isFinite(Number(val)) ? Number(val) : undefined })}
                                                    className="mt-1 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1 leading-snug">The full contract price the property sold for, before any deductions.</p>
                                            </label>
                                            <label className="block">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Selling Costs</span>
                                                <EditableCell
                                                    value={asset.sellingCosts ?? ''}
                                                    type="number"
                                                    onSave={(val) => editAsset(asset.id, { sellingCosts: Number.isFinite(Number(val)) ? Number(val) : undefined })}
                                                    className="mt-1 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1 leading-snug">Realtor commissions, closing costs, transfer taxes &mdash; what it cost you to sell.</p>
                                            </label>
                                        </div>
                                        <p className="text-[10px] text-purple-600/70 dark:text-purple-400/70 font-semibold -mt-2 mb-4">
                                            Sale Price &minus; Selling Costs = your net proceeds, which is what the gain/loss below is calculated from.
                                        </p>

                                        {/* The plain-English result */}
                                        <div className="grid gap-2 sm:grid-cols-4 text-center">
                                            <ResultTile label="Adjusted Basis" value={fmt(d!.adjustedBasis)} tone="slate" />
                                            <ResultTile label="Depr. Recapture" value={fmt(d!.depreciationRecapture)} sub={d!.recaptureType !== 'None' ? d!.recaptureType : undefined} tone="amber" />
                                            <ResultTile
                                                label={d!.isLoss ? 'Capital Loss' : 'Capital Gain'}
                                                value={fmt(d!.isLoss ? d!.totalGain : d!.capitalGain)}
                                                tone={d!.isLoss ? 'rose' : 'purple'}
                                                icon={d!.isLoss ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                                            />
                                            <ResultTile label="Total Gain/Loss" value={fmt(d!.totalGain)} tone="emerald" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {summary.dispositions.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-900/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Depreciation Recapture</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">{fmt(summary.totalDepreciationRecapture)}</div>
                            <p className="text-[10px] text-slate-500 mt-1">Taxed at ordinary rates (§1245) or max 25% (§1250 real property)</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-purple-500 bg-purple-50/30 dark:bg-purple-900/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-400">Long-Term Capital Gain</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-purple-700 dark:text-purple-400 font-mono">{fmt(summary.totalCapitalGain)}</div>
                            <p className="text-[10px] text-slate-500 mt-1">Taxed at 0/15/20% long-term capital gains rates</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-rose-400 bg-rose-50/20 dark:bg-rose-900/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Ordinary Loss (§1231)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{fmt(summary.ordinaryLoss)}</div>
                            <p className="text-[10px] text-slate-500 mt-1">Business-property losses deductible against ordinary income</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <p className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] text-muted-foreground italic flex items-start gap-2">
                <Info className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                Adjusted basis = building cost + land − depreciation taken. Selling at a gain triggers depreciation recapture first (you must &quot;pay back&quot; the tax benefit of the depreciation you claimed), then any remaining gain is long-term capital gain. This is a planning estimate only — confirm the recapture/capital-gain split and the 25% cap on unrecaptured §1250 gain on Form 4797 with a qualified tax professional.
            </p>
        </div>
    );
}

function ResultTile({ label, value, sub, tone, icon }: {
    label: string; value: string; sub?: string;
    tone: 'slate' | 'amber' | 'purple' | 'rose' | 'emerald';
    icon?: React.ReactNode;
}) {
    const tones: Record<string, string> = {
        slate: 'text-slate-700 dark:text-slate-300',
        amber: 'text-amber-700 dark:text-amber-400',
        purple: 'text-purple-700 dark:text-purple-400',
        rose: 'text-rose-600 dark:text-rose-400',
        emerald: 'text-emerald-700 dark:text-emerald-400',
    };
    return (
        <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-3">
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
            <div className={cn("text-lg font-black font-mono flex items-center justify-center gap-1", tones[tone])}>
                {icon}{value}
            </div>
            {sub && <div className="text-[8px] uppercase text-slate-400">{sub}</div>}
        </div>
    );
}
