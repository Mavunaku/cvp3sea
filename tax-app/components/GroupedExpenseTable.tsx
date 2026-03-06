'use client';

import { Transaction, EXPENSE_PILLARS, ExpensePillar } from '@/types';
import { ExpenseRow } from './ExpenseRow';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupedExpenseTableProps {
    transactions: Transaction[];
    onUpdate: (id: string, updates: Partial<Transaction>) => void;
    onDelete: (id: string) => void;
}

export function GroupedExpenseTable({ transactions, onUpdate, onDelete }: GroupedExpenseTableProps) {
    // Group transactions by Pillar
    const groups: Record<string, Transaction[]> = {
        'Taxes Paid': [],
        'Interest Expense': [],
        'Repairs': [],
        'Utilities': [],
        'Travels': [],
        'General Business': [],
        'Uncategorized': []
    };

    transactions.forEach(t => {
        const pillar = t.pillar || 'Uncategorized';
        if (groups[pillar]) {
            groups[pillar].push(t);
        } else {
            groups['Uncategorized'].push(t);
        }
    });

    // Valid Pillars Order
    const pillarOrder: (ExpensePillar | 'Uncategorized')[] = [
        'Taxes Paid',
        'Interest Expense',
        'Repairs',
        'Utilities',
        'Travels',
        'General Business',
        'Uncategorized'
    ];

    return (
        <tbody className="[&_tr:last-child]:border-0">
            {pillarOrder.map(pillar => {
                const groupTransactions = groups[pillar];
                if (groupTransactions.length === 0 && pillar === 'Uncategorized') return null;
                // If we want to show empty pillars to encourage filling them, we keep them.
                // Or we can hide empty pillars. Let's keep them primarily to show structure, but maybe hide Uncategorized if empty.

                const subtotal = groupTransactions.reduce((acc, t) => acc + t.amount, 0);

                return (
                    <PillarSection
                        key={pillar}
                        pillar={pillar}
                        transactions={groupTransactions}
                        subtotal={subtotal}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                    />
                );
            })}
        </tbody>
    );
}

// Sub-component for Collapsible Section
function PillarSection({
    pillar,
    transactions,
    subtotal,
    onUpdate,
    onDelete
}: {
    pillar: string,
    transactions: Transaction[],
    subtotal: number,
    onUpdate: (id: string, updates: Partial<Transaction>) => void;
    onDelete: (id: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <>
            <tr className="bg-muted/30 hover:bg-muted/50 cursor-pointer border-b group" onClick={() => setIsOpen(!isOpen)}>
                {/* Pillar and Count - Spanning Date to Payment Status (5 columns) */}
                <td colSpan={5} className="p-2">
                    <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span>{pillar}</span>
                        <span className="text-[10px] text-muted-foreground font-normal ml-2 uppercase tracking-wide">({transactions.length} items)</span>
                    </div>
                </td>
                {/* Subtotal - Aligned with Amount column (Col 6) */}
                <td className="p-2 text-right font-mono font-bold text-foreground w-24">
                    ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                {/* Empty cells for CAP, NY, and Actions (Cols 7, 8, 9) */}
                <td className="w-12"></td>
                <td className="w-12"></td>
                <td className="w-12"></td>
            </tr>
            {isOpen && transactions.map(t => (
                <ExpenseRow
                    key={t.id}
                    transaction={t}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                />
            ))}
            {isOpen && transactions.length === 0 && (
                <tr>
                    <td colSpan={9} className="h-12 text-center text-xs text-muted-foreground italic border-b">
                        No expenses in {pillar} yet.
                    </td>
                </tr>
            )}
        </>
    );
}
