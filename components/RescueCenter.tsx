'use client';

import { useStore } from '@/store/useStore';
import { Download, Upload, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export function RescueCenter() {
    const { exportState, importState } = useStore();
    const [importSuccess, setImportSuccess] = useState(false);

    const handleExport = () => {
        const data = exportState();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-ledger-rescue-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (window.confirm("CRITICAL: This will overwrite ALL current data on this port. Proceed?")) {
                    importState(json);
                    setImportSuccess(true);
                    setTimeout(() => setImportSuccess(false), 3000);
                }
            } catch (err) {
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-6 bg-slate-900/5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                    <ShieldAlert className="h-5 w-5 text-amber-600 pointer-events-none" />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Data Rescue & Port Migration</h3>
                    <p className="text-xs text-slate-500">Recover entries lost due to localhost port changes.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                >
                    <Download className="h-4 w-4 text-blue-600 pointer-events-none" />
                    <div className="text-left">
                        <div className="text-xs font-bold">Backup Everything</div>
                        <div className="text-[10px] text-slate-400">Save to JSON file</div>
                    </div>
                </button>

                <div className="relative">
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                        <Upload className="h-4 w-4 text-emerald-600 pointer-events-none" />
                        <div className="text-left">
                            <div className="text-xs font-bold">Restore Backup</div>
                            <div className="text-[10px] text-slate-400">Upload JSON file</div>
                        </div>
                    </div>
                </div>
            </div>

            {importSuccess && (
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold animate-in fade-in slide-in-from-bottom-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Data Restored Successfully! Ready to go.
                </div>
            )}

            <div className="text-[10px] text-slate-400 bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                <strong>Note:</strong> Browsers separate data by port. If you entered data on port 3001, it won&apos;t show on port 3000 unless you export it from 3001 and import it here.
            </div>
        </div>
    );
}
