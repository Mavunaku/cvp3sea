'use client';

import { useStore } from '@/store/useStore';
import { Asset } from '@/types';
import { EditableCell } from './EditableCell';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Keep usage consistent

export function AssetTable() {
    const {
        assets,
        addAsset,
        editAsset,
        deleteAsset,
        transactions,
        editTransaction,
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
    const totalAssetLand = filteredAssets.reduce((acc, a) => acc + (a.land || 0), 0);
    const assetStats = filteredAssets.map(calculateDepreciationDetails);
    const totalCurrentDepr = assetStats.reduce((acc, s) => acc + s.currentDepreciation, 0);
    const totalPriorDepr = assetStats.reduce((acc, s) => acc + s.prior, 0);
    const totalAccumDepr = assetStats.reduce((acc, s) => acc + s.accumulated, 0);


    const totalCapRepairsCost = capitalizedRepairs.reduce((acc, t) => acc + t.amount, 0);
    const totalCapRepairsDepreciation = capitalizedRepairs.reduce((acc, t) => {
        const usefulLife = t.capitalizeUsefulLife || 27.5;
        return acc + Math.round(t.amount / usefulLife);
    }, 0);

    return (
        <div className="space-y-8">
            {/* SECTION 1: Fixed Assets */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-indigo-700">Depreciation & Amortization Report</h2>
                        <p className="text-xs text-muted-foreground">Fixed Assets, Improvements, and Write-offs</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={!selectedProjectId}
                        title={!selectedProjectId ? "Select a Project first" : "Add Asset"}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white shadow hover:bg-indigo-700 h-9 px-4 py-2"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Asset
                    </button>
                </div>

                <div className="rounded-md border bg-card shadow-sm overflow-hidden border-collapse">
                    <div className="w-full overflow-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-48">Asset Description</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-32">Project</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-24 whitespace-nowrap">Date in Service</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-24 text-right">Cost (Net Land)</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-24 text-right">Land</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-16 text-center">Bus %</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-20 text-center">Sec 179</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-24 text-center">Spec. Allowance</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-28 text-right">Depr. Basis</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-16 text-center">Life</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-24 text-center">Method</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-16 text-center">Conv.</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-24 text-right">Prior Depr.</th>
                                    <th className="p-2 font-semibold text-muted-foreground border-r w-24 text-right">Current Depr.</th>
                                    <th className="p-2 font-semibold text-muted-foreground w-24 text-right">Accum. Depr.</th>
                                    <th className="p-2 font-semibold text-muted-foreground w-12 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredAssets.length === 0 ? (
                                    <tr>
                                        <td colSpan={14} className="h-24 text-center text-muted-foreground italic">
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
                                                <td className="p-2 border-r">
                                                    <select
                                                        value={asset.projectId || ''}
                                                        onChange={(e) => editAsset(asset.id, { projectId: e.target.value || undefined })}
                                                        className="w-full bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 py-0.5"
                                                    >
                                                        <option value="">Unassigned</option>
                                                        {projects.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
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
                                                <td className="p-2 border-r text-right font-mono">
                                                    <EditableCell
                                                        value={asset.priorDepreciation || 0}
                                                        type="number"
                                                        onSave={(val) => editAsset(asset.id, { priorDepreciation: Number(val) })}
                                                    />
                                                </td>
                                                <td className="p-2 border-r text-right font-mono text-emerald-600 font-bold bg-emerald-50/30">
                                                    <EditableCell
                                                        value={stats.currentDepreciation}
                                                        type="number"
                                                        onSave={(val) => editAsset(asset.id, { currentDepreciation: Number(val) })}
                                                        className="text-emerald-700 font-bold"
                                                    />
                                                </td>
                                                <td className="p-2 border-r text-right font-mono bg-muted/20">
                                                    <EditableCell
                                                        value={stats.accumulated}
                                                        type="number"
                                                        onSave={(val) => {
                                                            // When user edits Accum. Depr., we need to back-calculate Prior Depr.
                                                            // Accum = Prior + Current, so Prior = Accum - Current
                                                            const newAccum = Number(val);
                                                            const newPrior = newAccum - stats.currentDepreciation;
                                                            editAsset(asset.id, { priorDepreciation: newPrior });
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-2 text-center text-muted-foreground">
                                                    <button onClick={() => deleteAsset(asset.id)} className="hover:text-destructive">
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            <tfoot className="bg-muted font-bold border-t">
                                <tr>
                                    <td colSpan={3} className="p-2 text-right border-r uppercase">Totals</td>
                                    <td className="p-2 text-right border-r font-mono">${totalAssetCost.toLocaleString()}</td>
                                    <td className="p-2 text-right border-r font-mono">${totalAssetLand.toLocaleString()}</td>
                                    <td colSpan={7} className="border-r"></td>
                                    <td className="p-2 text-right border-r font-mono text-muted-foreground">${totalPriorDepr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="p-2 text-right border-r font-mono text-emerald-700">${totalCurrentDepr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="p-2 text-right border-r font-mono bg-muted-foreground/10">${totalAccumDepr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* SECTION 2: Capitalized Improvements (Read-Only from Transactions) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-amber-700">Capitalized Improvements</h2>
                        <p className="text-xs text-muted-foreground">Derived from Expenses marked as Capitalized</p>
                    </div>
                </div>

                <div className="rounded-md border bg-amber-50/30">
                    <div className="w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm border-collapse">
                            <thead>
                                <tr className="border-b transition-colors hover:bg-muted/50">
                                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-32">Date</th>
                                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Description/Vendor</th>
                                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground w-28">Cost</th>
                                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-24 text-center">Life</th>
                                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground w-32">Annual Depr.</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {capitalizedRepairs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No capitalized repairs found in Expenses for this project.
                                        </td>
                                    </tr>
                                ) : (
                                    capitalizedRepairs.map(t => {
                                        const usefulLife = t.capitalizeUsefulLife || 27.5;
                                        return (
                                            <tr key={t.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-2 align-middle">
                                                    <EditableCell
                                                        value={t.date}
                                                        type="date"
                                                        onSave={(val) => editTransaction(t.id, { date: String(val) })}
                                                    />
                                                </td>
                                                <td className="p-2 align-middle">
                                                    <EditableCell
                                                        value={t.description}
                                                        onSave={(val) => editTransaction(t.id, { description: String(val) })}
                                                    />
                                                </td>
                                                <td className="p-2 align-middle text-right font-mono text-amber-700">${t.amount.toLocaleString()}</td>
                                                <td className="p-2 align-middle text-center">
                                                    <select
                                                        value={usefulLife}
                                                        onChange={(e) => editTransaction(t.id, { capitalizeUsefulLife: Number(e.target.value) })}
                                                        className="bg-transparent text-xs w-full text-center focus:outline-none focus:ring-1 focus:ring-amber-500 rounded px-1 py-0.5"
                                                    >
                                                        <option value={3}>3 Yrs</option>
                                                        <option value={5}>5 Yrs</option>
                                                        <option value={7}>7 Yrs</option>
                                                        <option value={15}>15 Yrs</option>
                                                        <option value={27.5}>27.5 Yrs</option>
                                                        <option value={39}>39 Yrs</option>
                                                    </select>
                                                </td>
                                                <td className="p-2 align-middle text-right font-mono text-amber-700">
                                                    ${(t.amount / usefulLife).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            <tfoot className="bg-muted/50 font-medium border-t">
                                <tr>
                                    <td colSpan={2} className="p-2 text-right">Totals:</td>
                                    <td className="p-2 text-right font-mono text-amber-700">${totalCapRepairsCost.toLocaleString()}</td>
                                    <td></td>
                                    <td className="p-2 text-right font-mono text-amber-700">
                                        ${totalCapRepairsDepreciation.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            <p className="text-xs text-muted-foreground italic">
                * This is an estimate only. Depreciation rules vary. Confirm final depreciation strategy with a CPA.
            </p>
        </div>
    );
}
