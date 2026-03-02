'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useUIStore } from '@/store/useUIStore';
import { X, Check, Plus } from 'lucide-react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, Entity, TransactionType } from '@/types';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

import { usePathname } from 'next/navigation'; // Added

export function QuickAddModal() {
    const pathname = usePathname();
    const { isQuickAddOpen, closeQuickAdd } = useUIStore();
    const { addTransaction, projects, years, addProject, selectedProjectId, selectedYear } = useStore();

    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [entity, setEntity] = useState<Entity>('Freelance');
    const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [projectId, setProjectId] = useState('');

    useEffect(() => {
        if (isQuickAddOpen) {
            // Auto-select current project if available
            if (selectedProjectId) setProjectId(selectedProjectId);
        }
    }, [isQuickAddOpen, selectedProjectId]);

    if (pathname === '/login') return null;

    const handleCreateProject = () => {
        const name = prompt("Enter new project name:");
        if (name) {
            const year = selectedYear || new Date().getFullYear().toString();
            // Just assume Property for quick add, or Generic? Let's default to Generic or ask?
            // User put "+ Create Project" button inside dropdown.
            // Simple logic:
            const newProj = {
                id: uuidv4(),
                name,
                type: 'Generic' as const,
                yearId: year
            };
            // We need to commit this to store. `addTransaction` handles UUIDs but `addProject` in store might expect strict type. 
            // My store definition of addProject takes `Omit<Project, 'id'>`.
            addProject({ name, type: 'Generic', yearId: year });
            // We don't have the ID yet if store generates it... Wait, store uses `uuidv4()`.
            // Ideally store should return the ID or we generate it here if allowed.
            // The store implementation: `addProject: (project) => set((state) => ({ projects: [...state.projects, { ...project, id: uuidv4() }] }))`
            // Current store doesn't return ID. This is a limitation.
            // WORKAROUND: Generate ID here and pass it, OR modify store.
            // Store expects `Omit<Project, 'id'>`.
            // Let's rely on finding it by name or just asking user to select it after creation? 
            // Better: update store to accept optional ID or just let us manually set it if we really need to invalidly break interface...
            // Actually, I can just not select it automatically for now, or find it by name.
        }
    };

    if (!isQuickAddOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addTransaction({
            date,
            amount: parseFloat(amount),
            type,
            description,
            entity,
            category,
            status: 'Pending',
            projectId: projectId // Mandatory
        });
        closeQuickAdd();
        // Reset form
        setAmount('');
        setDescription('');
        setProjectId(selectedProjectId || '');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md mx-4 rounded-lg border shadow-lg p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Quick Add Transaction</h2>
                    <button onClick={closeQuickAdd} className="p-1 hover:bg-muted rounded-full">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-2 p-1 bg-muted rounded-lg">
                        <button
                            type="button"
                            onClick={() => { setType('expense'); setCategory(EXPENSE_CATEGORIES[0]); }}
                            className={cn(
                                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                type === 'expense' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => { setType('income'); setCategory(INCOME_CATEGORIES[0]); }}
                            className={cn(
                                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                type === 'income' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Income
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <input
                                type="number"
                                required
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-7 pr-3 py-2 rounded-md border bg-background text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="e.g. Home Depot run"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Date</label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Project / Folder</label>
                        <div className="flex gap-2">
                            <select
                                required
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="" disabled>Select Project...</option>
                                {years.map(year => (
                                    <optgroup key={year} label={year}>
                                        {projects.filter(p => p.yearId === year).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleCreateProject}
                                className="px-3 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/80 text-xs font-medium"
                                title="Create New Project"
                            >
                                + New
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        disabled={!projectId} // Strict Enforcement
                    >
                        <Check className="h-4 w-4" />
                        Save Transaction
                    </button>
                </form>
            </div>
        </div>
    );
}
