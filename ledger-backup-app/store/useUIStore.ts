import { create } from 'zustand';

interface UIState {
    isQuickAddOpen: boolean;
    openQuickAdd: () => void;
    closeQuickAdd: () => void;

    isImportOpen: boolean;
    openImport: () => void;
    closeImport: () => void;

    isManagerOpen: boolean;
    openManager: () => void;
    closeManager: () => void;

    isNotesOpen: boolean;
    openNotes: () => void;
    closeNotes: () => void;

    logout: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isQuickAddOpen: false,
    openQuickAdd: () => set({ isQuickAddOpen: true }),
    closeQuickAdd: () => set({ isQuickAddOpen: false }),

    isImportOpen: false,
    openImport: () => set({ isImportOpen: true }),
    closeImport: () => set({ isImportOpen: false }),

    isManagerOpen: false,
    openManager: () => set({ isManagerOpen: true }),
    closeManager: () => set({ isManagerOpen: false }),

    isNotesOpen: false,
    openNotes: () => set({ isNotesOpen: true }),
    closeNotes: () => set({ isNotesOpen: false }),

    logout: () => {
        document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        window.location.href = '/login';
    },
}));
