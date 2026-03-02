'use client';

import { Asset, ASSET_TYPES } from '@/types';
import { EditableCell } from './EditableCell';
import { Trash2, TrendingDown, Calendar, Percent } from 'lucide-react';
import { ProjectSelect } from './ProjectSelect';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AssetCardProps {
    asset: Asset;
    onUpdate: (id: string, updates: Partial<Asset>) => void;
    onDelete: (id: string) => void;
    depreciation: {
        currentDepreciation: number;
        accumulated: number;
    };
}

export function AssetCard({ asset, onUpdate, onDelete, depreciation }: AssetCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-4 space-y-4">
            {/* Header: Name & Cost */}
            <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1 mr-4">
                    <EditableCell
                        value={asset.name}
                        onSave={(val) => onUpdate(asset.id, { name: String(val) })}
                        className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2"
                    />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <EditableCell
                            value={asset.purchaseDate}
                            type="date"
                            onSave={(val) => onUpdate(asset.id, { purchaseDate: String(val) })}
                        />
                    </div>
                </div>
                <div className="text-right">
                    <EditableCell
                        value={asset.cost}
                        type="number"
                        onSave={(val) => onUpdate(asset.id, { cost: Number(val) })}
                        className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100"
                    />
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Cost Basis</div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Current Depr.</span>
                    <div className="text-sm font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        ${depreciation.currentDepreciation.toLocaleString()}
                    </div>
                </div>
                <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Accumulated</span>
                    <div className="text-sm font-mono font-medium text-slate-600 dark:text-slate-400">
                        ${depreciation.accumulated.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Type & Business Use */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <select
                        value={asset.type}
                        onChange={(e) => onUpdate(asset.id, { type: e.target.value as any })}
                        className="w-full text-xs border rounded px-2 py-1.5 bg-transparent"
                    >
                        {ASSET_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-1 border rounded px-2 py-1 bg-slate-50 dark:bg-slate-800">
                    <Percent className="h-3 w-3 text-slate-400" />
                    <EditableCell
                        value={asset.businessUsePercent ?? 100}
                        type="number"
                        onSave={(val) => onUpdate(asset.id, { businessUsePercent: Number(val) })}
                        className="text-xs font-mono w-12 text-right"
                    />
                </div>
            </div>

            {/* Project & Actions */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Project Assignment</label>
                    <ProjectSelect
                        value={asset.projectId}
                        onChange={(pid) => onUpdate(asset.id, { projectId: pid })}
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={() => onDelete(asset.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors"
                    >
                        <Trash2 className="h-3 w-3" />
                        Delete Asset
                    </button>
                </div>
            </div>
        </div>
    );
}
