import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction, Asset } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types';
import { loadUserData, syncAllData, deleteTransaction as dbDeleteTransaction, deleteAsset as dbDeleteAsset, deleteProject as dbDeleteProject } from '@/lib/database';

interface AppState {
    transactions: Transaction[];
    assets: Asset[];
    projects: Project[];
    years: string[]; // List of Year Folders (e.g. "2025", "2026")
    notes: string;

    // User State
    userId: string | null;
    isLoading: boolean;
    isSyncing: boolean;
    syncError: string | null; // Added to track sync failures
    lastSyncTime: Date | null;

    // Selection State
    selectedYear: string | null;
    selectedProjectId: string | null;

    // Actions
    setUserId: (userId: string | null) => void;
    loadFromDatabase: (userId: string) => Promise<void>;
    syncToDatabase: () => Promise<void>;

    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    addTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
    editTransaction: (id: string, updates: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;
    toggleAllNySource: (ids: string[], enabled: boolean) => void;

    addAsset: (asset: Omit<Asset, 'id'>) => void;
    editAsset: (id: string, updates: Partial<Asset>) => void;
    deleteAsset: (id: string) => void;

    addProject: (project: Omit<Project, 'id'>) => void;
    editProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;

    addYear: (year: string) => void;
    deleteYear: (year: string) => void;
    setNotes: (notes: string) => void;

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
            notes: '',
            userId: null,
            isLoading: false,
            isSyncing: false,
            syncError: null,
            lastSyncTime: null,
            selectedYear: null,
            selectedProjectId: null,

            setUserId: (userId) => set({ userId }),

            loadFromDatabase: async (userId: string) => {
                set({ isLoading: true });
                try {
                    const data = await loadUserData(userId);

                    // Safety Check: If remote is empty but local has data, preserve local
                    // This handles cases where RLS blocks writes but reads return empty
                    if (
                        data.transactions.length === 0 &&
                        data.projects.length === 0 &&
                        data.assets.length === 0
                    ) {
                        const state = get();
                        if (state.transactions.length > 0 || state.projects.length > 0) {
                            console.warn('Remote empty, local has data. Preserving local data (Offline/RLS protection).');
                            set({ isLoading: false, userId }); // Just update metadata
                            // Optionally trigger a sync attempt?
                            // setTimeout(() => get().syncToDatabase(), 1000); 
                            return;
                        }
                    }

                    set({
                        years: data.years,
                        projects: data.projects,
                        transactions: data.transactions,
                        assets: data.assets,
                        userId,
                        isLoading: false,
                        lastSyncTime: new Date(), // Mark as synced on load
                    });
                } catch (error: any) {
                    console.error('Failed to load data:', error);
                    set({ syncError: error.message || 'Failed to load data' });
                    // Do not clear state on error
                } finally {
                    set({ isLoading: false });
                }
            },

            syncToDatabase: async () => {
                const state = get();
                if (!state.userId) return;

                set({ isSyncing: true });
                set({ isSyncing: true, syncError: null }); // Clear previous sync error
                try {
                    await syncAllData(state.userId, {
                        years: state.years,
                        projects: state.projects,
                        transactions: state.transactions,
                        assets: state.assets,
                    });
                    set({ isSyncing: false, lastSyncTime: new Date(), syncError: null });
                } catch (error: any) {
                    console.error('Failed to sync data:', error);
                    set({ syncError: error.message || 'Failed to sync data' });
                } finally {
                    set({ isSyncing: false });
                }
            },

            addTransaction: (transaction) =>
                set((state) => {
                    let finalProjectId = transaction.projectId || state.selectedProjectId;
                    let newProjects = state.projects;
                    let finalProjectName = '';

                    if (!finalProjectId) {
                        const activeYear = state.selectedYear || new Date().getFullYear().toString();
                        const generalProject = state.projects.find(p => p.yearId === activeYear && p.name === 'General');

                        if (generalProject) {
                            finalProjectId = generalProject.id;
                            finalProjectName = generalProject.name;
                        } else {
                            const newGeneral: Project = {
                                id: uuidv4(),
                                name: 'General',
                                type: 'Generic',
                                yearId: activeYear
                            };
                            newProjects = [...state.projects, newGeneral];
                            finalProjectId = newGeneral.id;
                            finalProjectName = newGeneral.name;

                            // Background create project
                            supabase.from('projects').upsert([{
                                id: newGeneral.id,
                                name: newGeneral.name,
                                type: newGeneral.type,
                                year_id: newGeneral.yearId,
                                user_id: state.userId
                            }]).then(({ error }) => {
                                if (error) console.error("Auto-created General project failed:", error);
                            });
                        }
                    } else {
                        // Lookup name
                        const existing = newProjects.find(p => p.id === finalProjectId);
                        finalProjectName = existing ? existing.name : 'Unknown';
                    }

                    const newState = {
                        projects: newProjects,
                        transactions: [
                            ...state.transactions,
                            {
                                ...transaction,
                                id: uuidv4(),
                                projectId: finalProjectId,
                                projectName: finalProjectName,
                                nySource: transaction.nySource ?? true
                            },
                        ],
                    };

                    setTimeout(() => get().syncToDatabase(), 0);
                    return newState;
                }),

            addTransactions: (newTransactions) =>
                set((state) => {
                    const activeYear = state.selectedYear || new Date().getFullYear().toString();
                    let currentProjects = [...state.projects];

                    let generalProject = currentProjects.find(p => p.yearId === activeYear && p.name === 'General');
                    if (!generalProject) {
                        const newId = uuidv4();
                        generalProject = {
                            id: newId,
                            name: 'General',
                            type: 'Generic',
                            yearId: activeYear
                        };
                        currentProjects.push(generalProject);

                        // Background create
                        supabase.from('projects').upsert([{
                            id: newId,
                            name: 'General',
                            type: 'Generic',
                            year_id: activeYear,
                            user_id: state.userId
                        }]).then();
                    }

                    const transactionsWithIds = newTransactions.map(t => {
                        const pid = t.projectId || generalProject!.id;
                        const proj = currentProjects.find(p => p.id === pid);
                        return {
                            ...t,
                            id: uuidv4(),
                            projectId: pid,
                            projectName: proj ? proj.name : 'Unknown',
                            nySource: t.nySource ?? true
                        };
                    });

                    const newState = {
                        projects: currentProjects,
                        transactions: [...state.transactions, ...transactionsWithIds],
                    };

                    setTimeout(() => get().syncToDatabase(), 0);
                    return newState;
                }),

            editTransaction: (id, updates) =>
                set((state) => {
                    // If projectId changed, update projectName
                    let extraUpdates = {};
                    if (updates.projectId) {
                        const proj = state.projects.find(p => p.id === updates.projectId);
                        extraUpdates = { projectName: proj ? proj.name : 'Unknown' };
                    }

                    const newState = {
                        transactions: state.transactions.map((t) =>
                            t.id === id ? { ...t, ...updates, ...extraUpdates } : t
                        ),
                    };
                    setTimeout(() => get().syncToDatabase(), 0);
                    return newState;
                }),

            deleteTransaction: (id) =>
                set((state) => {
                    dbDeleteTransaction(id).catch(console.error);
                    return {
                        transactions: state.transactions.filter((t) => t.id !== id),
                    };
                }),

            toggleAllNySource: (ids, enabled) =>
                set((state) => {
                    const newState = {
                        transactions: state.transactions.map((t) =>
                            ids.includes(t.id) ? { ...t, nySource: enabled } : t
                        ),
                    };
                    setTimeout(() => get().syncToDatabase(), 0);
                    return newState;
                }),

            addAsset: (asset) =>
                set((state) => {
                    const newState = {
                        assets: [...state.assets, { ...asset, id: uuidv4() }],
                    };
                    setTimeout(() => get().syncToDatabase(), 0);
                    return newState;
                }),

            editAsset: (id, updates) =>
                set((state) => {
                    const newState = {
                        assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
                    };
                    setTimeout(() => get().syncToDatabase(), 0);
                    return newState;
                }),

            deleteAsset: (id) =>
                set((state) => {
                    dbDeleteAsset(id).catch(console.error);
                    return {
                        assets: state.assets.filter((a) => a.id !== id),
                    };
                }),

            addProject: (project) =>
                set((state) => {
                    const newState = {
                        projects: [...state.projects, { ...project, id: uuidv4() }],
                    };
                    setTimeout(() => get().syncToDatabase(), 0);
                    return newState;
                }),

            editProject: (id, updates) =>
                set((state) => {
                    const newState = {
                        projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
                    };
                    setTimeout(() => get().syncToDatabase(), 0);
                    return newState;
                }),

            deleteProject: (id) =>
                set((state) => {
                    dbDeleteProject(id).catch(console.error);
                    return {
                        projects: state.projects.filter((p) => p.id !== id),
                        transactions: state.transactions.filter((t) => t.projectId !== id),
                        assets: state.assets.filter((a) => a.projectId !== id),
                    };
                }),

            addYear: (year) =>
                set((state) => {
                    if (state.years.includes(year)) return state;
                    const newState = {
                        years: [...state.years, year],
                    };
                    setTimeout(() => get().syncToDatabase(), 0);
                    return newState;
                }),

            deleteYear: (year) =>
                set((state) => {
                    const projectsInYear = state.projects.filter(p => p.yearId === year);
                    const projectIdsToDelete = projectsInYear.map(p => p.id);

                    projectIdsToDelete.forEach(id => dbDeleteProject(id).catch(console.error));

                    const newState = {
                        years: state.years.filter((y) => y !== year),
                        projects: state.projects.filter((p) => p.yearId !== year),
                        transactions: state.transactions.filter((t) => !projectIdsToDelete.includes(t.projectId || '')),
                        assets: state.assets.filter((a) => !projectIdsToDelete.includes(a.projectId || '')),
                    };

                    setTimeout(() => get().syncToDatabase(), 0);
                    return newState;
                }),

            setSelectedYear: (year) => set({ selectedYear: year, selectedProjectId: null }),
            setSelectedProject: (projectId) => set({ selectedProjectId: projectId }),
            setNotes: (notes) => {
                set({ notes });
                setTimeout(() => get().syncToDatabase(), 1000);
            },

            getSummary: () => {
                const state = get();
                const revenue = state.transactions
                    .filter((t) => t.type === 'income')
                    .reduce((acc, t) => acc + t.amount, 0);
                const expenses = state.transactions
                    .filter((t) => t.type === 'expense')
                    .reduce((acc, t) => acc + t.amount, 0);
                const netProfit = revenue - expenses;
                const nySourceRevenue = state.transactions
                    .filter((t) => t.type === 'income' && (t.nySource ?? true))
                    .reduce((acc, t) => acc + t.amount, 0);
                const nySourceExpenses = state.transactions
                    .filter((t) => t.type === 'expense' && (t.nySource ?? true))
                    .reduce((acc, t) => acc + t.amount, 0);
                const nySourceIncome = nySourceRevenue - nySourceExpenses;

                const fedTaxRate = 0.35;
                const nyTaxRate = 0.065;
                const fedTax = netProfit > 0 ? netProfit * fedTaxRate : 0;
                const nyTax = nySourceIncome > 0 ? nySourceIncome * nyTaxRate : 0;
                const taxLiability = fedTax + nyTax;

                return {
                    revenue,
                    expenses,
                    netProfit,
                    taxLiability,
                    fedTax,
                    nyTax,
                    nySourceIncome,
                };
            },

            importState: (importedState) => {
                set({
                    transactions: importedState.transactions || [],
                    assets: importedState.assets || [],
                    projects: importedState.projects || [],
                    years: importedState.years || [],
                });
                setTimeout(() => get().syncToDatabase(), 0);
            },

            exportState: () => {
                const state = get();
                return {
                    transactions: state.transactions,
                    assets: state.assets,
                    projects: state.projects,
                    years: state.years,
                };
            },
        }),
        {
            name: 'tax-app-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                transactions: state.transactions,
                assets: state.assets,
                projects: state.projects,
                years: state.years,
                notes: state.notes,
                userId: state.userId,
            }),
        }
    ));
