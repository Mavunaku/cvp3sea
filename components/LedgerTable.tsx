'use client';

import { Transaction, TransactionType } from "@/types";
import { TransactionRow } from "./TransactionRow";
import { Plus } from "lucide-react";
import { useStore } from "@/store/useStore";
import { ExportButton } from "./ExportButton";
import { GroupedExpenseTable } from "./GroupedExpenseTable";

interface LedgerTableProps {
    type: TransactionType;
}

export function LedgerTable({ type }: LedgerTableProps) {
    const {
        transactions,
        addTransaction,
        editTransaction,
        deleteTransaction,
        projects,
        selectedYear,
        selectedProjectId,
        toggleAllNySource
    } = useStore();

    // Filter by Global Context (Project/Year)
    const contextFilteredTransactions = transactions.filter(t => {
        if (selectedProjectId) return t.projectId === selectedProjectId;
        if (selectedYear) return t.date.startsWith(selectedYear);
        return true;
    });

    const filteredTransactions = contextFilteredTransactions.filter(t => t.type === type);

    const handleAdd = () => {
        addTransaction({
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            type,
            entity: 'Freelance', // Default
            category: type === 'income' ? 'Contract' : 'Other',
            description: type === 'income' ? 'New Invoice' : 'New Expense',
            status: 'Pending',
            pillar: type === 'expense' ? 'General Business' : undefined, // Phase 3 Default
        });
    };

    // Sort by date desc
    const sortedTransactions = [...filteredTransactions].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Select All Logic
    const visibleTransactions = sortedTransactions;
    const allNyChecked = visibleTransactions.length > 0 && visibleTransactions.every(t => t.nySource ?? true);
    const someNyChecked = visibleTransactions.some(t => t.nySource ?? true) && !allNyChecked;

    const handleToggleAllNy = () => {
        const targetState = !allNyChecked;
        toggleAllNySource(visibleTransactions.map(t => t.id), targetState);
    };

    // Calculate Totals for Footer
    // Calculate Totals for Footer (Deductible for Expenses, Raw for Income)
    const totalAmount = type === 'income'
        ? sortedTransactions.filter(t => t.nySource ?? true).reduce((acc, t) => acc + (t.amount || 0), 0)
        : sortedTransactions.filter(t => t.nySource ?? true).reduce((acc, t) => {
            const amount = t.amount || 0;
            if (t.pillar === 'Interest Expense') {
                if (t.interest !== undefined) return acc + (t.interest || 0);
                if (t.category === 'Loan Principal') return acc;
                return acc + amount;
            }
            if (t.pillar === 'Travels') {
                if (t.category.includes('(50% Deductible)')) return acc + (amount * 0.5);
                if (t.category === 'Entertainment (Non-Deductible)') return acc;
                return acc + amount;
            }
            if (t.capitalize) return acc; // Skip capitalized repairs
            return acc + amount;
        }, 0);
    const travelsTotal = type === 'expense'
        ? sortedTransactions.filter(t => t.pillar === 'Travels').reduce((acc, t) => {
            const amount = t.amount || 0;
            if (t.category.includes('(50% Deductible)')) return acc + (amount * 0.5);
            if (t.category === 'Entertainment (Non-Deductible)') return acc;
            return acc + amount;
        }, 0)
        : 0;
    const travelsGross = type === 'expense'
        ? sortedTransactions.filter(t => t.pillar === 'Travels').reduce((acc, t) => acc + (t.amount || 0), 0)
        : 0;
    const mealsSubtotal = type === 'expense'
        ? sortedTransactions.filter(t => t.pillar === 'Travels' && t.category.includes('(50% Deductible)')).reduce((acc, t) => acc + (t.amount || 0), 0)
        : 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight capitalize">{type} Ledger</h2>
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add {type}
                </button>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                    <table className="w-full caption-bottom text-sm border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-28">DATE</th>

                                {type === 'income' ? (
                                    <>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground min-w-[120px]">Description</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-40">Project</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-40">Category</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-32">Pymnt Status</th>
                                        <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground w-24">Amount</th>
                                        <th className="h-10 px-2 text-center align-middle font-medium text-muted-foreground w-12">
                                            <div className="flex flex-col items-center gap-0.5">
                                                <span className="text-[9px] uppercase font-bold opacity-70">NY</span>
                                                <input
                                                    type="checkbox"
                                                    checked={allNyChecked}
                                                    ref={(el) => {
                                                        if (el) el.indeterminate = someNyChecked;
                                                    }}
                                                    onChange={handleToggleAllNy}
                                                    className="h-3.5 w-3.5 rounded border-sage-300 text-sage-600 focus:ring-sage-500 cursor-pointer"
                                                    title="Toggle All NY"
                                                />
                                            </div>
                                        </th>
                                    </>
                                ) : (
                                    <>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground min-w-[120px]">Description</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-40">Project</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-40">Category</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-32">Pymnt Status</th>
                                        <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground w-24">Amount</th>
                                        <th className="h-10 px-2 text-center align-middle font-medium text-muted-foreground w-12">
                                            <div className="flex flex-col items-center gap-0.5">
                                                <span className="text-[9px] uppercase font-bold opacity-70">NY</span>
                                                <input
                                                    type="checkbox"
                                                    checked={allNyChecked}
                                                    ref={(el) => {
                                                        if (el) el.indeterminate = someNyChecked;
                                                    }}
                                                    onChange={handleToggleAllNy}
                                                    className="h-3.5 w-3.5 rounded border-sage-300 text-sage-600 focus:ring-sage-500 cursor-pointer"
                                                    title="Toggle All NY"
                                                />
                                            </div>
                                        </th>
                                        <th className="h-10 px-2 text-center align-middle font-medium text-muted-foreground w-12">
                                            <span className="text-[9px] uppercase font-bold opacity-70 text-amber-600">CAP</span>
                                        </th>
                                    </>
                                )}
                                <th className="h-10 px-2 align-middle font-medium text-muted-foreground w-12 text-center">Actions</th>
                            </tr>
                        </thead>

                        {type === 'income' ? (
                            <tbody className="[&_tr:last-child]:border-0">
                                {sortedTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="h-24 text-center text-muted-foreground">
                                            No transactions found. Click &quot;Add {type}&quot; to start.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedTransactions.map((t) => (
                                        <TransactionRow
                                            key={t.id}
                                            transaction={t}
                                            onUpdate={editTransaction}
                                            onDelete={deleteTransaction}
                                        />
                                    ))
                                )}
                            </tbody>
                        ) : (
                            <GroupedExpenseTable
                                transactions={sortedTransactions}
                                onUpdate={editTransaction}
                                onDelete={deleteTransaction}
                            />
                        )}

                        <SummaryFooter
                            type={type}
                            totalAmount={totalAmount}
                            travelsTotal={travelsTotal}
                            travelsGross={travelsGross}
                            mealsSubtotal={mealsSubtotal}
                            transactions={sortedTransactions}
                        />
                    </table>
                </div>
            </div>
            <div className="flex items-center justify-end gap-2 text-muted-foreground text-xs">
                {/* Import Placeholder */}
                <button
                    className="hover:text-foreground transition-colors"
                    onClick={() => alert("Import Feature Coming Soon")}
                >
                    Import CSV ({type})
                </button>
                <div className="h-4 w-px bg-border" />
                <ExportButton type={type} />
            </div>
        </div>
    );
}

function SummaryFooter({
    type,
    totalAmount,
    travelsTotal,
    travelsGross,
    mealsSubtotal,
    transactions
}: {
    type: 'income' | 'expense';
    totalAmount: number;
    travelsTotal: number;
    travelsGross: number;
    mealsSubtotal: number;
    transactions: Transaction[];
}) {
    const grossTotal = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);

    return (
        <tfoot className="bg-muted/50 font-medium border-t">
            {/* Main Total Row */}
            <tr>
                <td colSpan={6} className="p-2 text-right text-sm">
                    {type === 'expense' ? 'Deductible Total:' : 'Total Income:'}
                </td>
                <td className="p-2 text-right font-mono text-sm font-bold">
                    ${(totalAmount || 0).toLocaleString()}
                </td>
                <td colSpan={2} className="text-[10px] text-muted-foreground pl-2 italic">
                    {type === 'expense' && grossTotal !== totalAmount && `(Total Spent: $${(grossTotal || 0).toLocaleString()})`}
                </td>
            </tr>

            {type === 'expense' && (
                <>
                    {/* Travels Breakdown Row */}
                    {travelsGross > 0 && (
                        <tr className="text-blue-600 border-t border-blue-100/20">
                            <td colSpan={6} className="p-2 text-right text-sm">Travels Deductible:</td>
                            <td className="p-2 text-right font-mono font-bold text-sm leading-none">
                                <div className="flex flex-col items-end">
                                    <span>${(travelsTotal || 0).toLocaleString()}</span>
                                    {travelsGross !== travelsTotal && (
                                        <span className="text-[9px] opacity-60">
                                            (Gross: ${(travelsGross || 0).toLocaleString()}, 50% Meals incl.)
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td colSpan={2}></td>
                        </tr>
                    )}
                </>
            )}
        </tfoot>
    );
}
