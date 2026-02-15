'use client';

import { Transaction, EXPENSE_PILLARS, ExpensePillar } from '@/types';
import { EditableCell } from './EditableCell';
import { Trash2, AlertCircle } from 'lucide-react'; // AlertCircle for tooltips if needed
import { ProjectSelect } from './ProjectSelect';
import { cn } from '@/lib/utils';

import { useStore } from '@/store/useStore';

interface ExpenseRowProps {
    transaction: Transaction;
    onUpdate: (id: string, updates: Partial<Transaction>) => void;
    onDelete: (id: string) => void;
}

export function ExpenseRow({ transaction, onUpdate, onDelete }: ExpenseRowProps) {
    const { projects, years } = useStore();
    const isCapitalized = transaction.capitalize;

    // Helper to handle Pillar change
    const handlePillarChange = (newPillar: ExpensePillar) => {
        // Reset category when pillar changes to avoid mismatch
        const defaultCategory = EXPENSE_PILLARS[newPillar][0];
        onUpdate(transaction.id, { pillar: newPillar, category: defaultCategory });
    };

    return (
        <tr className={cn(
            "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
            isCapitalized && "bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200/50 dark:hover:bg-amber-900/50"
        )}>
            {/* Date */}
            <td className="p-2 align-middle">
                <EditableCell
                    value={transaction.date}
                    type="date"
                    onSave={(val) => onUpdate(transaction.id, { date: String(val) })}
                />
            </td>

            {/* Description */}
            <td className="p-2 align-middle">
                <EditableCell
                    value={transaction.description}
                    placeholder="Description"
                    onSave={(val) => onUpdate(transaction.id, { description: String(val) })}
                />
            </td>

            {/* PROJECT */}
            <td className="p-2 align-middle">
                <ProjectSelect
                    value={transaction.projectId}
                    onChange={(pid) => onUpdate(transaction.id, { projectId: pid })}
                />
            </td>



            {/* HIERARCHICAL CATEGORY SELECTION */}
            <td className="p-2 align-middle">
                <div className="flex flex-col gap-1">
                    {/* Pillar Selector */}
                    <select
                        value={transaction.pillar || 'General Business'}
                        onChange={(e) => handlePillarChange(e.target.value as ExpensePillar)}
                        className="h-7 w-full rounded border border-sage-200 bg-transparent px-1 py-0 text-xs font-semibold focus:border-sage-500 focus:outline-none"
                    >
                        {Object.keys(EXPENSE_PILLARS).map((p) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                    {/* Sub-category Selector */}
                    <div className="relative group/cat">
                        <select
                            value={transaction.category}
                            onChange={(e) => onUpdate(transaction.id, { category: e.target.value })}
                            className="h-7 w-full rounded border border-transparent bg-transparent px-1 py-0 text-xs text-muted-foreground focus:border-sage-500 focus:outline-none"
                        >
                            {(EXPENSE_PILLARS[transaction.pillar || 'General Business'] || []).map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        {transaction.category.includes('(50% Deductible)') && (
                            <div className="absolute -top-3 right-0">
                                <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-50 border border-rose-200 px-1 rounded-sm shadow-sm whitespace-nowrap animate-pulse">
                                    50% OFF
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </td>

            {/* Status */}
            <td className="p-2 align-middle">
                <select
                    value={transaction.status}
                    onChange={(e) => onUpdate(transaction.id, { status: e.target.value as any })}
                    className={cn(
                        "h-8 w-full rounded border border-transparent bg-transparent px-2 py-1 text-xs focus:border-sage-500 focus:outline-none",
                        transaction.status === 'Reconciled' && "text-emerald-600 font-medium",
                        transaction.status === 'Pending' && "text-amber-600"
                    )}
                >
                    <option value="Pending">Pending</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Reconciled">Reconciled</option>
                </select>
            </td>

            {/* Amount */}
            <td className="p-2 align-middle text-right">
                <div className="flex flex-col items-end">
                    <EditableCell
                        value={transaction.amount}
                        type="number"
                        onSave={(val) => onUpdate(transaction.id, { amount: Number(val) })}
                        className="justify-end font-mono"
                    />
                    {(() => {
                        let taxPrice = transaction.amount;
                        let showTaxPrice = false;

                        if (transaction.pillar === 'Interest Expense') {
                            if (transaction.interest !== undefined) {
                                taxPrice = transaction.interest;
                                showTaxPrice = true;
                            } else if (transaction.category === 'Loan Principal') {
                                taxPrice = 0;
                                showTaxPrice = true;
                            }
                        } else if (transaction.pillar === 'Travels') {
                            if (transaction.category.includes('(50% Deductible)')) {
                                taxPrice = transaction.amount * 0.5;
                                showTaxPrice = true;
                            } else if (transaction.category === 'Entertainment (Non-Deductible)') {
                                taxPrice = 0;
                                showTaxPrice = true;
                            }
                        } else if (transaction.capitalize) {
                            taxPrice = 0;
                            showTaxPrice = true;
                        }

                        if (!showTaxPrice) return null;

                        return (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 leading-none">
                                Deductible: ${(taxPrice ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        );
                    })()}
                </div>
            </td>

            {/* Actions */}
            <td className="p-2 align-middle text-right">
                <button
                    onClick={() => onDelete(transaction.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </td>
        </tr>
    );
}
