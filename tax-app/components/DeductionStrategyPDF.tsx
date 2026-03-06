'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { X, Printer, FileText, Zap, Info } from 'lucide-react';
import { Asset } from '@/types';

interface DeductionStrategyPDFProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DeductionStrategyPDF({ isOpen, onClose }: DeductionStrategyPDFProps) {
    const { assets, transactions, projects, selectedProjectId, selectedYear } = useStore();

    if (!isOpen) return null;

    const filteredAssets = selectedProjectId
        ? assets.filter(a => a.projectId === selectedProjectId)
        : assets;

    const capitalizedRepairs = transactions.filter(t =>
        t.capitalize === true &&
        (!selectedProjectId || t.projectId === selectedProjectId)
    );

    const calculateDepreciationDetails = (asset: Asset) => {
        const cost = asset.cost || 0;
        const businessUse = asset.businessUsePercent / 100;
        const totalBasis = cost * businessUse;

        let currentDepreciation = 0;
        if (asset.currentDepreciation !== undefined) {
            currentDepreciation = asset.currentDepreciation;
        } else if (asset.section179) {
            currentDepreciation = totalBasis;
        } else if (asset.bonusDepreciation) {
            currentDepreciation = totalBasis;
        } else {
            currentDepreciation = totalBasis / asset.usefulLife;
        }

        const prior = asset.priorDepreciation || 0;
        const roundedCurrentDepr = Math.round(currentDepreciation);
        const accumulated = prior + roundedCurrentDepr;

        return {
            currentDepreciation: roundedCurrentDepr,
            prior,
            accumulated
        };
    };

    const totalAssetCost = filteredAssets.reduce((acc, a) => acc + a.cost, 0);
    const assetStats = filteredAssets.map(calculateDepreciationDetails);
    const totalCurrentDepr = assetStats.reduce((acc, s) => acc + s.currentDepreciation, 0);
    const totalCapRepairsCost = capitalizedRepairs.reduce((acc, t) => acc + t.amount, 0);
    const totalCapRepairsDepreciation = capitalizedRepairs.reduce((acc, t) => acc + Math.round(t.amount / 27.5), 0);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white text-slate-900">
            <div className="bg-white w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col print:shadow-none print:max-h-none print:rounded-none">

                {/* Header Control */}
                <div className="p-4 border-b flex justify-between items-center print:hidden bg-slate-50 rounded-t-3xl">
                    <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-indigo-600" />
                        <h2 className="font-bold">Deduction Strategy PDF Export</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg active:scale-95">
                            <Printer className="h-4 w-4" />
                            Print Strategy
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Print Content */}
                <div className="p-10 print:p-6">
                    <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Deduction Strategy Center</h1>
                            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
                                {selectedProjectId ? `Property: ${projects.find(p => p.id === selectedProjectId)?.name}` : `Comprehensive Portfolio: ${selectedYear}`}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-black text-slate-900">CVP PROPERTIES</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 ring-4 ring-emerald-500/5">
                            <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Total 2026 Write-off</div>
                            <div className="text-3xl font-black text-emerald-900 font-mono">${(totalCurrentDepr + totalCapRepairsDepreciation).toLocaleString()}</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Asset Basis</div>
                            <div className="text-3xl font-black text-slate-900 font-mono">${(totalAssetCost + totalCapRepairsCost).toLocaleString()}</div>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                            <div className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-1">Strategy Impact</div>
                            <div className="text-3xl font-black text-indigo-900 font-mono">${totalCurrentDepr.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Main Table: Fixed Assets */}
                    <div className="mb-10">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-indigo-600" />
                            Fixed Asset Ledger
                        </h3>
                        <table className="w-full border-collapse text-[10px]">
                            <thead>
                                <tr className="border-b-2 border-slate-200 text-slate-500 font-black uppercase tracking-tighter">
                                    <th className="py-2 text-left">Asset / Description</th>
                                    <th className="py-2 text-center w-24">Life</th>
                                    <th className="py-2 text-right w-24">Cost</th>
                                    <th className="py-2 text-right w-24 bg-emerald-50 border-x border-emerald-100 text-emerald-800">2026 Write-off</th>
                                    <th className="py-2 text-right w-24">LTD Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAssets.length === 0 ? (
                                    <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">No fixed assets recorded.</td></tr>
                                ) : (
                                    filteredAssets.map((asset, i) => {
                                        const stats = assetStats[i];
                                        return (
                                            <tr key={asset.id} className="hover:bg-slate-50/50">
                                                <td className="py-3 pr-4 font-bold text-slate-900">{asset.name} <span className="text-[8px] font-normal text-slate-400 opacity-70 ml-2">({asset.type})</span></td>
                                                <td className="py-3 text-center">{asset.usefulLife} Yrs</td>
                                                <td className="py-3 text-right font-mono">${asset.cost.toLocaleString()}</td>
                                                <td className="py-3 text-right font-mono font-black text-emerald-700 bg-emerald-500/5 border-x border-emerald-500/10">
                                                    ${stats.currentDepreciation.toLocaleString()}
                                                </td>
                                                <td className="py-3 text-right font-mono font-bold text-slate-400">${stats.accumulated.toLocaleString()}</td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Secondary Table: Improvements */}
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                            <Info className="h-4 w-4 text-amber-500" />
                            Property Improvements (Synced)
                        </h3>
                        <table className="w-full border-collapse text-[10px]">
                            <thead>
                                <tr className="border-b-2 border-slate-200 text-slate-500 font-black uppercase tracking-tighter">
                                    <th className="py-2 text-left">Description</th>
                                    <th className="py-2 text-center w-24">Life</th>
                                    <th className="py-2 text-right w-24">Amount</th>
                                    <th className="py-2 text-right w-24 bg-amber-50 border-x border-amber-100 text-amber-800">2026 Write-off</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {capitalizedRepairs.length === 0 ? (
                                    <tr><td colSpan={4} className="py-8 text-center text-slate-400 italic">No capitalized improvements found.</td></tr>
                                ) : (
                                    capitalizedRepairs.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50">
                                            <td className="py-3 pr-4 font-bold text-slate-900">{t.description}</td>
                                            <td className="py-3 text-center">27.5 Yrs</td>
                                            <td className="py-3 text-right font-mono">${t.amount.toLocaleString()}</td>
                                            <td className="py-3 text-right font-mono font-black text-amber-700 bg-amber-500/5 border-x border-amber-500/10">
                                                ${Math.round(t.amount / 27.5).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-12 flex justify-between items-end border-t border-slate-100 pt-6">
                        <div className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed max-w-md italic">
                            * CONFIDENTIAL INTERNAL DOCUMENT. THE INFORMATION PROVIDED ABOVE CONSTITUTES FINANCIAL PLANNING ESTIMATIONS ONLY. FINAL TAX STRATEGIES MUST BE REVIEWED BY A CERTIFIED PUBLIC ACCOUNTANT.
                        </div>
                        <div className="text-[10px] font-black text-slate-900 border-b-2 border-slate-900">
                            CVP TAX AUDIT {new Date().getFullYear()}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: portrait;
                        margin: 1cm;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
