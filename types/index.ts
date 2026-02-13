export type Entity = 'CVP' | 'Freelance';
export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: string;
    date: string;
    amount: number;
    type: TransactionType;
    entity: Entity;
    category: string;
    description: string; // "Source" for income, "Description" for expense
    status: 'Pending' | 'Cleared' | 'Reconciled';
    notes?: string;
    receiptUrl?: string;
}

export const INCOME_CATEGORIES = ['Rent', 'Contract', 'Consulting', 'Other'];
export const EXPENSE_CATEGORIES = [
    'Repairs',
    'Travel',
    'Software',
    'Utilities',
    'Mortgage Interest',
    'Property Taxes',
    'Advertising',
    'Office Supplies',
    'Legal/Professional',
    'Other'
];
