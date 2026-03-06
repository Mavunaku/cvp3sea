'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { filterTransactions } from '@/lib/calculations';
import { X, Printer, FileSpreadsheet } from 'lucide-react';

interface HighDensityLedgerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HighDensityLedger({ isOpen, onClose }: HighDensityLedgerProps) {
    const { transactions, projects, selectedYear, selectedProjectId } = useStore();

    if (!isOpen) return null;

    const filteredTransactions = filterTransactions(transactions, projects, selectedYear, selectedProjectId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white">
            <div className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col print:shadow-none print:max-h-none print:rounded-none">

                {/* Header Control */}
                <div className="p-4 border-b flex justify-between items-center print:hidden bg-slate-50 dark:bg-slate-800 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                        <h2 className="font-bold">High-Density Print Ledger</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all">
                            <Printer className="h-4 w-4" />
                            Print / Save PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Print Content */}
                <div className="p-8 print:p-4 text-[9px] leading-tight">
                    <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2 mb-4">
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tighter">Full Transaction Ledger</h1>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">
                                {selectedProjectId ? `Project: ${projects.find(p => p.id === selectedProjectId)?.name}` : `Tax Year: ${selectedYear || 'Comprehensive'}`}
                            </p>
                        </div>
                        <div className="text-right text-[8px] font-bold uppercase text-slate-400">
                            Generated {new Date().toLocaleDateString()} • Property of CVP Properties
                        </div>
                    </div>

                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-300">
                                <th className="py-1 text-left w-16 px-1">Date</th>
                                <th className="py-1 text-left px-1">Description / Vendor</th>
                                <th className="py-1 text-left w-24 px-1">Category</th>
                                <th className="py-1 text-left w-24 px-1">Pillar</th>
                                <th className="py-1 text-right w-16 px-1">Amount</th>
                                <th className="py-1 text-center w-8 px-1">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50">
                                    <td className="py-1 px-1 font-mono text-slate-500 whitespace-nowrap">{t.date}</td>
                                    <td className="py-1 px-1 font-medium truncate max-w-[250px]">{t.description}</td>
                                    <td className="py-1 px-1 text-slate-500 italic truncate max-w-[120px]">{t.category}</td>
                                    <td className="py-1 px-1 text-slate-400 uppercase font-bold text-[7px]">{t.pillar || '—'}</td>
                                    <td className={`py-1 px-1 text-right font-mono font-bold ${t.type === 'income' ? 'text-emerald-700' : 'text-slate-900'}`}>
                                        ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-1 px-1 text-center">
                                        <span className={`text-[6px] px-1 font-black uppercase rounded ${t.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                            {t.type.substring(0, 1)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-900 font-black">
                            <tr>
                                <td colSpan={4} className="py-2 text-right uppercase tracking-widest text-[8px]">Total Net Impact</td>
                                <td className="py-2 text-right font-mono text-xs">
                                    ${filteredTransactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-[7px] text-slate-400 font-bold uppercase italic">
                        <span>* High-density ledger for internal accounting use.</span>
                        <span>Sheet 1 of 1 (Optimized)</span>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: portrait;
                        margin: 0.5cm;
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
