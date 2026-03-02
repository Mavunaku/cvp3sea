'use client';

import { Transaction, INCOME_CATEGORIES, EXPENSE_CATEGORIES, Entity } from '@/types';
import { EditableCell } from './EditableCell';
import { Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { ProjectSelect } from './ProjectSelect';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TransactionCardProps {
    transaction: Transaction;
    onUpdate: (id: string, updates: Partial<Transaction>) => void;
    onDelete: (id: string) => void;
}

export function TransactionCard({ transaction, onUpdate, onDelete }: TransactionCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const categories = transaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-4 space-y-3">
            {/* Header: Date & Amount */}
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <EditableCell
                        value={transaction.date}
                        type="date"
                        onSave={(val) => onUpdate(transaction.id, { date: String(val) })}
                        className="text-xs text-muted-foreground font-medium"
                    />
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2">
                        <EditableCell
                            value={transaction.description}
                            onSave={(val) => onUpdate(transaction.id, { description: String(val) })}
                            className="w-full"
                        />
                    </div>
                </div>
                <div className="text-right">
                    <EditableCell
                        value={transaction.amount}
                        type="number"
                        onSave={(val) => onUpdate(transaction.id, { amount: Number(val) })}
                        className={cn(
                            "text-lg font-bold font-mono",
                            transaction.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"
                        )}
                    />
                </div>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap gap-2 items-center">
                {/* Category Badge */}
                <div className="relative">
                    <select
                        value={transaction.category}
                        onChange={(e) => onUpdate(transaction.id, { category: e.target.value })}
                        className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full py-1 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 pr-6 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status Badge */}
                <select
                    value={transaction.status}
                    onChange={(e) => onUpdate(transaction.id, { status: e.target.value as any })}
                    className={cn(
                        "appearance-none rounded-full py-1 px-3 text-xs font-bold border",
                        transaction.status === 'Reconciled' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                            transaction.status === 'Cleared' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                "bg-slate-100 text-slate-500 border-slate-200"
                    )}
                >
                    <option value="Pending">Pending</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Reconciled">Reconciled</option>
                </select>
            </div>

            {/* Expandable Details */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <span>{isExpanded ? 'Hide Details' : 'Show Details (Project, NY Source)'}</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                {isExpanded && (
                    <div className="mt-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
                        {/* Project */}
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Project</label>
                            <ProjectSelect
                                value={transaction.projectId}
                                onChange={(pid) => onUpdate(transaction.id, { projectId: pid })}
                            />
                        </div>

                        {/* Toggles */}
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                            <label className="text-xs font-medium">NY Source</label>
                            <input
                                type="checkbox"
                                checked={transaction.nySource ?? true}
                                onChange={(e) => onUpdate(transaction.id, { nySource: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end pt-2 gap-2">
                            {transaction.type === 'expense' && (
                                <button
                                    className="p-2 text-slate-500 hover:text-emerald-600 bg-slate-100 rounded-full"
                                    title="Upload Receipt"
                                >
                                    <FileText className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                onClick={() => onDelete(transaction.id)}
                                className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 rounded-full"
                                title="Delete"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
