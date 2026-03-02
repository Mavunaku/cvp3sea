'use client';

import { Transaction, INCOME_CATEGORIES, EXPENSE_CATEGORIES, Entity } from '@/types';
import { EditableCell } from './EditableCell';
import { Trash2, FileText } from 'lucide-react';
import { ProjectSelect } from './ProjectSelect';
import { cn } from '@/lib/utils'; // Keep inconsistent for now or fix? Use global cn.

import { useStore } from '@/store/useStore';

interface TransactionRowProps {
    transaction: Transaction;
    onUpdate: (id: string, updates: Partial<Transaction>) => void;
    onDelete: (id: string) => void;
}

export function TransactionRow({ transaction, onUpdate, onDelete }: TransactionRowProps) {
    const { projects, years } = useStore();
    const categories = transaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdate(transaction.id, { entity: e.target.value as Entity });
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdate(transaction.id, { category: e.target.value });
    };

    return (
        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <td className="p-2 align-middle">
                <EditableCell
                    value={transaction.date}
                    type="date"
                    onSave={(val) => onUpdate(transaction.id, { date: String(val) })}
                    className="w-32"
                />
            </td>
            <td className="p-2 align-middle">
                <EditableCell
                    value={transaction.description}
                    onSave={(val) => onUpdate(transaction.id, { description: String(val) })}
                    className="font-medium"
                />
            </td>
            <td className="p-2 align-middle">
                {/* Project Selector */}
                <ProjectSelect
                    value={transaction.projectId}
                    onChange={(pid) => onUpdate(transaction.id, { projectId: pid })}
                />
            </td>

            <td className="p-2 align-middle">
                <select
                    value={transaction.category}
                    onChange={handleCategoryChange}
                    className="h-8 w-full rounded border border-transparent bg-transparent px-2 py-1 text-sm hover:border-sage-300 focus:border-sage-500 focus:outline-none dark:hover:border-sage-700"
                >
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </td>
            <td className="p-2 align-middle">
                <select
                    value={transaction.status}
                    onChange={(e) => onUpdate(transaction.id, { status: e.target.value as any })}
                    className={cn(
                        "h-8 w-full rounded border border-transparent bg-transparent px-2 py-1 text-xs focus:border-sage-500 focus:outline-none",
                        transaction.status === 'Reconciled' ? "text-emerald-600 font-medium" :
                            transaction.status === 'Cleared' ? "text-blue-600" :
                                "text-muted-foreground"
                    )}
                >
                    <option value="Pending">Pending</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Reconciled">Reconciled</option>
                </select>
            </td>
            <td className="p-2 align-middle text-right">
                <EditableCell
                    value={transaction.amount}
                    type="number"
                    onSave={(val) => onUpdate(transaction.id, { amount: Number(val) })}
                    className="justify-end font-mono"
                />
            </td>
            <td className="p-2 align-middle text-center">
                <input
                    type="checkbox"
                    checked={transaction.nySource ?? true}
                    onChange={(e) => onUpdate(transaction.id, { nySource: e.target.checked })}
                    className="h-4 w-4 rounded border-sage-300 text-sage-600 focus:ring-sage-500 cursor-pointer"
                />
            </td>
            {/* Actions */}
            <td className="p-2 align-middle text-right">
                <div className="flex items-center justify-end gap-2">
                    {transaction.type === 'expense' && (
                        <button
                            className="text-muted-foreground hover:text-sage-600"
                            title="Upload Receipt (Placeholder)"
                        >
                            <FileText className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(transaction.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}
