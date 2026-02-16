'use client';

import { useStore } from '@/store/useStore';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

import { TransactionType } from '@/types';

interface ExportButtonProps {
    type?: TransactionType;
}

export function ExportButton({ type }: ExportButtonProps) {
    const transactions = useStore((state) => state.transactions);

    const handleExport = () => {
        const filtered = type ? transactions.filter(t => t.type === type) : transactions;

        // Headers: Date, Description, Amount, Type, Entity, Category, Notes, Source/Vendor, Details, Pillar, Capitalize, Property, Mileage
        const headers = ['Date', 'Description', 'Amount', 'Type', 'Entity', 'Category', 'Notes', 'Source/Vendor', 'Details', 'Pillar', 'Capitalize', 'Property', 'Mileage'];

        const csvContent = [
            headers.join(','),
            ...filtered.map(t => {
                const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
                return [
                    t.date,
                    escape(t.description),
                    t.amount,
                    t.type,
                    t.entity,
                    t.category,
                    escape(t.notes || ''),
                    escape(t.type === 'income' ? t.source || '' : t.vendor || ''),
                    t.type === 'income' ? (t.nySource ? 'NY Source' : '') : (t.receiptAvailable ? 'Receipt Yes' : 'Receipt No'),
                    t.pillar || '',
                    t.capitalize ? 'Yes' : 'No',
                    escape(t.property || ''),
                    t.mileage || ''
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `taxtrak_${type || 'all'}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            onClick={handleExport}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
        >
            <Download className="mr-2 h-4 w-4" />
            Export {type ? (type === 'income' ? 'Income' : 'Expenses') : 'All'}
        </button>
    );
}
