import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction, Asset, Project } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
    transactions: Transaction[];
    assets: Asset[];
    projects: Project[];
    years: string[];

    selectedYear: string | null;
    selectedProjectId: string | null;

    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    addTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
    editTransaction: (id: string, updates: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;

    addAsset: (asset: Omit<Asset, 'id'>) => void;
    editAsset: (id: string, updates: Partial<Asset>) => void;
    deleteAsset: (id: string) => void;

    addProject: (project: Omit<Project, 'id'>) => void;
    editProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;

    addYear: (year: string) => void;
    deleteYear: (year: string) => void;

    setSelectedYear: (year: string | null) => void;
    setSelectedProject: (projectId: string | null) => void;

    getSummary: () => {
        revenue: number;
        expenses: number;
        netProfit: number;
        taxLiability: number;
        nySourceIncome: number;
    };
    importState: (state: any) => void;
    exportState: () => any;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            transactions: [],
            assets: [],
            projects: [],
            years: [],
            selectedYear: null,
            selectedProjectId: null,

            addTransaction: (transaction) =>
                set((state) => {
                    let finalProjectId = transaction.projectId || state.selectedProjectId;
                    let newProjects = state.projects;

                    if (!finalProjectId) {
                        const activeYear = state.selectedYear || new Date().getFullYear().toString();
                        const generalProject = state.projects.find(p => p.yearId === activeYear && p.name === 'General');

                        if (generalProject) {
                            finalProjectId = generalProject.id;
                        } else {
                            const newGeneral: Project = {
                                id: uuidv4(),
                                name: 'General',
                                type: 'Generic',
                                yearId: activeYear
                            };
                            newProjects = [...state.projects, newGeneral];
                            finalProjectId = newGeneral.id;
                        }
                    }

                    return {
                        projects: newProjects,
                        transactions: [
                            ...state.transactions,
                            { ...transaction, id: uuidv4(), projectId: finalProjectId },
                        ],
                    };
                }),

            addTransactions: (newTransactions) =>
                set((state) => {
                    const activeYear = state.selectedYear || new Date().getFullYear().toString();
                    let currentProjects = [...state.projects];

                    const processedTransactions = newTransactions.map(t => {
                        let finalProjectId = t.projectId || state.selectedProjectId;

                        if (!finalProjectId) {
                            const generalProject = currentProjects.find(p => p.yearId === activeYear && p.name === 'General');
                            if (generalProject) {
                                finalProjectId = generalProject.id;
                            } else {
                                const newGeneral: Project = {
                                    id: uuidv4(),
                                    name: 'General',
                                    type: 'Generic',
                                    yearId: activeYear
                                };
                                currentProjects.push(newGeneral);
                                finalProjectId = newGeneral.id;
                            }
                        }
                        return { ...t, id: uuidv4(), projectId: finalProjectId };
                    });

                    return {
                        projects: currentProjects,
                        transactions: [...state.transactions, ...processedTransactions]
                    };
                }),

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

            addAsset: (asset) =>
                set((state) => {
                    let finalProjectId = asset.projectId || state.selectedProjectId;
                    let newProjects = state.projects;

                    if (!finalProjectId) {
                        const activeYear = state.selectedYear || new Date().getFullYear().toString();
                        const generalProject = state.projects.find(p => p.yearId === activeYear && p.name === 'General');

                        if (generalProject) {
                            finalProjectId = generalProject.id;
                        } else {
                            const newGeneral: Project = {
                                id: uuidv4(),
                                name: 'General',
                                type: 'Generic',
                                yearId: activeYear
                            };
                            newProjects = [...state.projects, newGeneral];
                            finalProjectId = newGeneral.id;
                        }
                    }

                    return {
                        projects: newProjects,
                        assets: [
                            ...state.assets,
                            {
                                ...asset,
                                id: uuidv4(),
                                projectId: finalProjectId,
                                land: asset.land || 0,
                                priorDepreciation: asset.priorDepreciation || 0,
                                currentDepreciation: 0,
                                method: 'MACRS',
                                convention: 'HY'
                            },
                        ],
                    };
                }),
            editAsset: (id, updates) =>
                set((state) => ({
                    assets: state.assets.map((a) =>
                        a.id === id ? { ...a, ...updates } : a
                    ),
                })),
            deleteAsset: (id) =>
                set((state) => ({
                    assets: state.assets.filter((a) => a.id !== id),
                })),

            addProject: (project) =>
                set((state) => ({
                    projects: [...state.projects, { ...project, id: uuidv4() }]
                })),
            editProject: (id, updates) =>
                set((state) => ({
                    projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
                })),
            deleteProject: (id) =>
                set((state) => {
                    return {
                        projects: state.projects.filter(p => p.id !== id),
                        transactions: state.transactions.filter(t => t.projectId !== id),
                        assets: state.assets.filter(a => a.projectId !== id),
                        selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId
                    };
                }),

            addYear: (year) =>
                set((state) => ({
                    years: state.years.includes(year) ? state.years : [...state.years, year].sort().reverse()
                })),
            deleteYear: (year) =>
                set((state) => {
                    const projectsToDelete = state.projects.filter(p => p.yearId === year).map(p => p.id);
                    return {
                        years: state.years.filter(y => y !== year),
                        projects: state.projects.filter(p => p.yearId !== year),
                        transactions: state.transactions.filter(t =>
                            !projectsToDelete.includes(t.projectId || '') &&
                            !t.date.startsWith(year)
                        ),
                        assets: state.assets.filter(a =>
                            !projectsToDelete.includes(a.projectId || '') &&
                            !a.purchaseDate?.startsWith(year)
                        ),
                        selectedYear: state.selectedYear === year ? null : state.selectedYear,
                        selectedProjectId: state.selectedProjectId && projectsToDelete.includes(state.selectedProjectId) ? null : state.selectedProjectId
                    };
                }),

            setSelectedYear: (year) => set({ selectedYear: year, selectedProjectId: null }),
            setSelectedProject: (projectId) => set({ selectedProjectId: projectId }),

            getSummary: () => {
                const { transactions } = get();
                const revenue = transactions
                    .filter((t) => t.type === 'income')
                    .reduce((acc, t) => acc + t.amount, 0);
                const expenses = transactions
                    .filter((t) => t.type === 'expense')
                    .reduce((acc, t) => acc + t.amount, 0);
                const nySourceIncome = transactions
                    .filter((t) => t.type === 'income' && t.nySource)
                    .reduce((acc, t) => acc + t.amount, 0);
                const netProfit = revenue - expenses;
                const taxLiability = netProfit > 0 ? netProfit * (0.153 + 0.25) : 0;

                return { revenue, expenses, netProfit, taxLiability, nySourceIncome };
            },

            importState: (newState) => {
                set(newState);
            },
            exportState: () => {
                const {
                    transactions,
                    assets,
                    projects,
                    years,
                    selectedYear,
                    selectedProjectId
                } = get();
                return {
                    transactions,
                    assets,
                    projects,
                    years,
                    selectedYear,
                    selectedProjectId
                };
            },
        }),
        {
            name: 'tax-app-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
