// Lightweight localStorage persistence for Landlord Toolbox drafts, so
// filling out a lease/notice form survives a refresh or coming back later —
// these are single-user working documents, not shared ledger data, so
// localStorage (not Supabase) is the right amount of persistence.

export function loadDraft<T extends object>(key: string): Partial<T> | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function saveDraft(key: string, data: Record<string, unknown>) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch {
        // Ignore quota errors — the in-memory form state still works fine.
    }
}

export function clearDraft(key: string) {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
}
