import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction, TransactionType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    editTransaction: (id: string, updates: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;
    getSummary: () => {
        revenue: number;
        expenses: number;
        netProfit: number;
        taxLiability: number;
    };
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            transactions: [],
            addTransaction: (transaction) =>
                set((state) => ({
                    transactions: [
                        ...state.transactions,
                        { ...transaction, id: uuidv4() },
                    ],
                })),
            editTransaction: (id, updates) =>
                set((state) => ({
                    transactions: state.transactions.map((t) =>
                        t.id === id ? { ...t, ...updates } : t
                    ),
                })),
            deleteTransaction: (id) =>
                set((state) => ({
                    transactions: state.transactions.filter((t) => t.id !== id),
                })),
            getSummary: () => {
                const { transactions } = get();
                const revenue = transactions
                    .filter((t) => t.type === 'income')
                    .reduce((acc, t) => acc + t.amount, 0);
                const expenses = transactions
                    .filter((t) => t.type === 'expense')
                    .reduce((acc, t) => acc + t.amount, 0);

                const netProfit = revenue - expenses;

                // Tax Calc: 15.3% SE Tax + ~25% Income Tax Placeholder (Federal + NY)
                // If profit is negative, tax is 0.
                const taxLiability = netProfit > 0 ? netProfit * (0.153 + 0.25) : 0;

                return { revenue, expenses, netProfit, taxLiability };
            },
        }),
        {
            name: 'tax-app-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
