'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { useUIStore } from '@/store/useUIStore';
import { X, Upload, FileText, Check, AlertTriangle, Trash2 } from 'lucide-react';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { Entity, TransactionType, Transaction, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';

export function ImportModal() {
    const { isImportOpen, closeImport } = useUIStore();
    const { addTransactions, projects, years, selectedYear, selectedProjectId } = useStore();

    const [step, setStep] = useState<'upload' | 'map' | 'review'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [rawData, setRawData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);

    // Column Mapping State
    const [columnMap, setColumnMap] = useState({
        date: '',
        description: '',
        amount: '',
        category: '', // Optional
    });

    // Default Settings for Batch
    const [defaultEntity, setDefaultEntity] = useState<Entity>('Freelance');
    const [defaultProject, setDefaultProject] = useState<string>(selectedProjectId || '');
    const [defaultYear, setDefaultYear] = useState<string>(selectedYear || new Date().getFullYear().toString());

    // Preview Data
    const [previewTransactions, setPreviewTransactions] = useState<Omit<Transaction, 'id'>[]>([]);

    if (!isImportOpen) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (uploadedFile) {
            setFile(uploadedFile);
            Papa.parse(uploadedFile, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setRawData(results.data);
                    if (results.meta.fields) {
                        setHeaders(results.meta.fields);
                        // Auto-guess columns
                        const lowerFields = results.meta.fields.map(f => f.toLowerCase());
                        setColumnMap({
                            date: results.meta.fields[lowerFields.findIndex(f => f.includes('date'))] || '',
                            description: results.meta.fields[lowerFields.findIndex(f => f.includes('desc') || f.includes('memo'))] || '',
                            amount: results.meta.fields[lowerFields.findIndex(f => f.includes('amount') || f.includes('debit') || f.includes('credit'))] || '',
                            category: results.meta.fields[lowerFields.findIndex(f => f.includes('category'))] || '',
                        });
                    }
                    setStep('map');
                }
            });
        }
    };

    const handleProcess = () => {
        // Convert raw data to Transaction objects
        const transactions: Omit<Transaction, 'id'>[] = rawData.map((row) => {
            const dateStr = row[columnMap.date];
            const descStr = row[columnMap.description];
            let amountVal = parseFloat(row[columnMap.amount]?.replace(/[^0-9.-]/g, ''));

            // Simple Type Detection logic: 
            // If negative, it's expense? Banks vary. 
            // Often: -100 is expense, +100 is income.
            // Let's assume standard bank format: Negative = Outflow (Expense), Positive = Inflow (Income).

            let type: TransactionType = 'expense';
            if (amountVal > 0) type = 'income';
            if (amountVal < 0) {
                type = 'expense';
                amountVal = Math.abs(amountVal); // Store as positive magnitude
            }
            if (isNaN(amountVal)) amountVal = 0;

            // Try to map category if column exists
            let category = 'Uncategorized';
            if (columnMap.category && row[columnMap.category]) {
                // Fuzzy match? For now just use it if valid, else default.
                const catVal = row[columnMap.category];
                if (INCOME_CATEGORIES.includes(catVal) || EXPENSE_CATEGORIES.includes(catVal)) {
                    category = catVal;
                }
            }

            return {
                date: new Date(dateStr).toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
                amount: amountVal,
                description: descStr || 'Imported Transaction',
                category,
                entity: defaultEntity,
                type,
                status: 'Cleared', // Assume bank imports are cleared
                projectId: defaultProject || undefined, // Will use default logic in store if undefined
                vendor: type === 'expense' ? descStr : undefined,
                source: type === 'income' ? descStr : undefined,
            };
        });

        setPreviewTransactions(transactions);
        setStep('review');
    };

    const handleImport = () => {
        if (previewTransactions.length > 0) {
            addTransactions(previewTransactions);
            closeImport();
            // Reset
            setStep('upload');
            setFile(null);
            setPreviewTransactions([]);
        }
    };

    const handleRemoveRow = (index: number) => {
        const newPreview = [...previewTransactions];
        newPreview.splice(index, 1);
        setPreviewTransactions(newPreview);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-background w-full max-w-4xl max-h-[90vh] rounded-lg border shadow-xl flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Upload className="h-5 w-5 text-indigo-500" />
                        Import Transactions
                    </h2>
                    <button onClick={closeImport} className="p-1 hover:bg-muted rounded-full">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden p-6">
                    {step === 'upload' && (
                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors p-10">
                            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                                Drag and drop your bank statement CSV here, or click to browse.
                            </p>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label
                                htmlFor="csv-upload"
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer font-medium"
                            >
                                Select CSV File
                            </label>
                        </div>
                    )}

                    {step === 'map' && (
                        <div className="space-y-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-md flex gap-4 items-center">
                                <FileText className="h-8 w-8 text-indigo-500" />
                                <div>
                                    <div className="font-semibold">{file?.name}</div>
                                    <div className="text-xs text-muted-foreground">{rawData.length} rows found</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-medium border-b pb-2">Column Mapping</h3>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Date Column</label>
                                        <select
                                            className="w-full p-2 border rounded-md"
                                            value={columnMap.date}
                                            onChange={(e) => setColumnMap({ ...columnMap, date: e.target.value })}
                                        >
                                            <option value="">Select Column...</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Description Column</label>
                                        <select
                                            className="w-full p-2 border rounded-md"
                                            value={columnMap.description}
                                            onChange={(e) => setColumnMap({ ...columnMap, description: e.target.value })}
                                        >
                                            <option value="">Select Column...</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Amount Column</label>
                                        <select
                                            className="w-full p-2 border rounded-md"
                                            value={columnMap.amount}
                                            onChange={(e) => setColumnMap({ ...columnMap, amount: e.target.value })}
                                        >
                                            <option value="">Select Column...</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-medium border-b pb-2">Default Assignations</h3>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Assign to Project</label>
                                        <select
                                            className="w-full p-2 border rounded-md"
                                            value={defaultProject}
                                            onChange={(e) => setDefaultProject(e.target.value)}
                                        >
                                            <option value="">Uncategorized (General)</option>
                                            {years.map(year => (
                                                <optgroup key={year} label={year}>
                                                    {projects.filter(p => p.yearId === year).map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Assign to Entity</label>
                                        <select
                                            className="w-full p-2 border rounded-md"
                                            value={defaultEntity}
                                            onChange={(e) => setDefaultEntity(e.target.value as Entity)}
                                        >
                                            <option value="Freelance">Freelance</option>
                                            <option value="CVP">CVP (Rental)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="h-full flex flex-col">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-semibold">Review Transactions ({previewTransactions.length})</h3>
                                <div className="text-sm text-muted-foreground">
                                    Total Amount: <span className="font-mono text-foreground">${previewTransactions.reduce((acc, t) => acc + t.amount, 0).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto border rounded-md">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted sticky top-0">
                                        <tr>
                                            <th className="p-2 font-medium">Date</th>
                                            <th className="p-2 font-medium">Description</th>
                                            <th className="p-2 font-medium text-right">Amount</th>
                                            <th className="p-2 font-medium">Type</th>
                                            <th className="p-2 font-medium text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {previewTransactions.map((t, i) => (
                                            <tr key={i} className="hover:bg-muted/50">
                                                <td className="p-2 whitespace-nowrap">{t.date}</td>
                                                <td className="p-2 truncate max-w-[200px]" title={t.description}>{t.description}</td>
                                                <td className={cn("p-2 text-right font-mono", t.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>
                                                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                                                </td>
                                                <td className="p-2 capitalize">{t.type}</td>
                                                <td className="p-2 text-center">
                                                    <button onClick={() => handleRemoveRow(i)} className="text-muted-foreground hover:text-destructive p-1">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t bg-muted/20 flex justify-end gap-2">
                    {step !== 'upload' && (
                        <button
                            onClick={() => setStep(step === 'review' ? 'map' : 'upload')}
                            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
                        >
                            Back
                        </button>
                    )}

                    {step === 'map' && (
                        <button
                            onClick={handleProcess}
                            disabled={!columnMap.date || !columnMap.amount}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
                        >
                            Preview
                        </button>
                    )}

                    {step === 'review' && (
                        <button
                            onClick={handleImport}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-bold flex items-center gap-2"
                        >
                            <Check className="h-4 w-4" />
                            Import {previewTransactions.length} Transactions
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
