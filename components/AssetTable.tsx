'use client';

import { useStore } from '@/store/useStore';
import { Asset, ASSET_TYPES } from '@/types';
import { EditableCell } from './EditableCell';
import { AssetCard } from './AssetCard';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AssetTable() {
    const {
        assets,
        addAsset,
        editAsset,
        deleteAsset,
        transactions,
        projects,
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
            const life = asset.usefulLife || 5;
            currentDepreciation = totalBasis / life;
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
    const assetStats = filteredAssets.map(calculateDepreciationDetails);

    // Calculate Cap Repairs
    const totalCapRepairsCost = capitalizedRepairs.reduce((acc, t) => acc + t.amount, 0);
    const totalCapRepairsDepreciation = capitalizedRepairs.reduce((acc, t) => {
        const usefulLife = t.capitalizeUsefulLife || 27.5;
        return acc + Math.round(t.amount / usefulLife);
    }, 0);

    return (
        <div className="space-y-8">
            {/* SECTION 1: Fixed Assets & Improvements */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-indigo-700">Depreciation & Amortization</h2>
                        <p className="text-xs text-muted-foreground">Fixed Assets, Improvements, and Write-offs</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white shadow hover:bg-indigo-700 h-9 px-4 py-2"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Asset
                    </button>
                </div>

                {/* Desktop Table View */}
                <div className="rounded-md border hidden md:block">
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 transition-colors hover:bg-muted/50">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-48">Asset Name</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-32">Type</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-32">Date</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-32">Cost</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-20">Bus. %</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-20">Life</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-32">Current Depr.</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-32">Accumulated</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-40">Project</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssets.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="h-24 text-center text-muted-foreground italic">
                                            {selectedProjectId ? "No assets record for this context." : "No assets found."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAssets.map((asset) => {
                                        const stats = calculateDepreciationDetails(asset);
                                        return (
                                            <tr key={asset.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle font-medium">
                                                    <EditableCell
                                                        value={asset.name}
                                                        onSave={(val) => editAsset(asset.id, { name: String(val) })}
                                                    />
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <select
                                                        value={asset.type}
                                                        onChange={(e) => editAsset(asset.id, { type: e.target.value as any })}
                                                        className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-sm hover:border-sage-300 focus:border-sage-500 focus:outline-none"
                                                    >
                                                        {ASSET_TYPES.map(t => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <EditableCell
                                                        value={asset.purchaseDate}
                                                        type="date"
                                                        onSave={(val) => editAsset(asset.id, { purchaseDate: String(val) })}
                                                    />
                                                </td>
                                                <td className="p-4 align-middle text-right font-mono">
                                                    <EditableCell
                                                        value={asset.cost}
                                                        type="number"
                                                        onSave={(val) => editAsset(asset.id, { cost: Number(val) })}
                                                    />
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <EditableCell
                                                        value={asset.businessUsePercent ?? 100}
                                                        type="number"
                                                        onSave={(val) => editAsset(asset.id, { businessUsePercent: Number(val) })}
                                                    />
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <EditableCell
                                                        value={asset.usefulLife}
                                                        type="number"
                                                        onSave={(val) => editAsset(asset.id, { usefulLife: Number(val) as any })}
                                                    />
                                                </td>
                                                <td className="p-4 align-middle text-right font-mono text-emerald-600 font-medium">
                                                    ${stats.currentDepreciation.toLocaleString()}
                                                </td>
                                                <td className="p-4 align-middle text-right font-mono text-muted-foreground">
                                                    ${stats.accumulated.toLocaleString()}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <select
                                                        className="w-full h-8 rounded border border-transparent bg-transparent text-xs hover:border-slate-300 focus:border-slate-500 truncate"
                                                        value={asset.projectId || ""}
                                                        onChange={(e) => editAsset(asset.id, { projectId: e.target.value || null })}
                                                    >
                                                        <option value="">No Project</option>
                                                        {projects.filter(p => !selectedProjectId || p.id === selectedProjectId).map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <button
                                                        onClick={() => deleteAsset(asset.id)}
                                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            <tfoot className="bg-muted/50 font-medium border-t">
                                <tr>
                                    <td colSpan={3} className="p-4 text-right">Fixed Assets Total:</td>
                                    <td className="p-4 text-right font-mono">${totalAssetCost.toLocaleString()}</td>
                                    <td colSpan={6}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {filteredAssets.map((asset) => {
                        const stats = calculateDepreciationDetails(asset);
                        return (
                            <AssetCard
                                key={asset.id}
                                asset={asset}
                                onUpdate={editAsset}
                                onDelete={deleteAsset}
                                depreciation={{
                                    currentDepreciation: stats.currentDepreciation,
                                    accumulated: stats.accumulated
                                }}
                            />
                        );
                    })}
                    {filteredAssets.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground border rounded-lg border-dashed">
                            No fixed assets found.
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION 2: Capitalized Improvements (Auto-Calculated) */}
            {capitalizedRepairs.length > 0 && (
                <div className="rounded-md border bg-slate-50 dark:bg-slate-900/50 p-4">
                    <h3 className="font-semibold text-sm mb-4">Capitalized Improvements (From Expenses)</h3>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 font-medium text-muted-foreground">Improvement Description</th>
                                    <th className="text-right py-2 font-medium text-muted-foreground">Cost</th>
                                    <th className="text-right py-2 font-medium text-muted-foreground">Life (Yrs)</th>
                                    <th className="text-right py-2 font-medium text-muted-foreground">Current Depr.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {capitalizedRepairs.map(t => {
                                    const life = t.capitalizeUsefulLife || 27.5;
                                    const depr = Math.round(t.amount / life);
                                    return (
                                        <tr key={t.id} className="border-b last:border-0 border-slate-200 dark:border-slate-800">
                                            <td className="py-2">{t.description}</td>
                                            <td className="py-2 text-right font-mono">${t.amount.toLocaleString()}</td>
                                            <td className="py-2 text-right">{life}</td>
                                            <td className="py-2 text-right font-mono text-emerald-600">${depr.toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="font-bold border-t border-slate-300 dark:border-slate-700">
                                <tr>
                                    <td className="py-2 text-right">Total Improvements:</td>
                                    <td className="py-2 text-right">${totalCapRepairsCost.toLocaleString()}</td>
                                    <td></td>
                                    <td className="py-2 text-right">${totalCapRepairsDepreciation.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Mobile List View */}
                    <div className="md:hidden space-y-3">
                        {capitalizedRepairs.map(t => {
                            const life = t.capitalizeUsefulLife || 27.5;
                            const depr = Math.round(t.amount / life);
                            return (
                                <div key={t.id} className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 text-sm">
                                    <div className="font-medium mb-1">{t.description}</div>
                                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                                        <span>{t.date}</span>
                                        <span>{life} yr life</span>
                                    </div>
                                    <div className="flex justify-between items-center font-mono">
                                        <span className="font-bold">${t.amount.toLocaleString()}</span>
                                        <span className="text-emerald-600">+${depr.toLocaleString()}/yr</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground italic">
                * This is an estimate only. Depreciation rules vary. Confirm final depreciation strategy with a CPA.
            </p>
        </div>
    );
}
