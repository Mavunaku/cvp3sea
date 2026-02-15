import { supabase } from './supabase';
import { Transaction, Asset, Project, Entity } from '@/types';

export interface UserData {
    years: string[];
    projects: Project[];
    transactions: Transaction[];
    assets: Asset[];
}

/**
 * Load all user data from Supabase
 */
// ... (We need to be careful with multi-replace)
// I will replace specific blocks to ensure correctness.

/**
 * Load all user data from Supabase
 */
export async function loadUserData(userId: string): Promise<UserData> {
    try {
        const [yearsRes, projectsRes, transactionsRes, assetsRes] = await Promise.all([
            supabase.from('years').select('*').eq('user_id', userId),
            supabase.from('projects').select('*').eq('user_id', userId),
            supabase.from('ledger_entries').select('*').eq('user_id', userId), // User table name
            supabase.from('assets').select('*').eq('user_id', userId),
        ]);

        if (yearsRes.error) throw yearsRes.error;
        if (projectsRes.error) throw projectsRes.error;
        if (transactionsRes.error) throw transactionsRes.error;
        if (assetsRes.error) throw assetsRes.error;

        const loadedProjects = projectsRes.data.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            yearId: p.year_id,
        }));

        const existingProjectIds = new Set(loadedProjects.map(p => p.id));
        // Map Transactions with Type Assertions and Self-Healing Linkage
        const transactions: Transaction[] = transactionsRes.data.map((t) => {
            let pid = t.project_id;
            let pname = t.project_name;
            const yearId = t.date ? t.date.split('-')[0] : null;

            // Linkage repair: If we have a name but no ID (or invalid ID), try to reconcile with year-awareness
            if (pname && (!pid || !existingProjectIds.has(pid))) {
                const match = loadedProjects.find(p => p.name === pname && p.yearId === yearId);
                if (match) pid = match.id;
                else if (!yearId) {
                    // Fallback to first name match if no date info
                    const fallbackMatch = loadedProjects.find(p => p.name === pname);
                    if (fallbackMatch) pid = fallbackMatch.id;
                }
            }

            return {
                id: t.id,
                date: t.date,
                amount: t.amount,
                type: t.type as Transaction['type'],
                description: t.description,
                category: t.category,
                status: (t.status || 'Cleared') as Transaction['status'],
                entity: 'CVP' as Entity,
                projectId: pid,
                projectName: pname,
                nySource: t.ny_source,
                pillar: t.pillar,
                interest: t.interest,
                capitalize: t.capitalize,
            };
        });

        // Helper for UUID
        const generateUUID = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };

        // Infer Projects from Transactions if STILL missing after mapping
        const inferredProjects: Project[] = [];
        for (const t of transactions) {
            if (t.projectName && !t.projectId) {
                const yearId = t.date ? t.date.split('-')[0] : new Date().getFullYear().toString();
                const alreadyInferred = inferredProjects.find(p => p.name === t.projectName && p.yearId === yearId);

                if (!alreadyInferred) {
                    const newId = generateUUID();
                    const newProject: Project = {
                        id: newId,
                        name: t.projectName,
                        type: 'Generic',
                        yearId: yearId
                    };
                    inferredProjects.push(newProject);

                    // Update the transaction being processed to use this new ID
                    t.projectId = newId;

                    // Background Create
                    supabase.from('projects').upsert([{
                        id: newId,
                        name: newProject.name,
                        type: newProject.type,
                        year_id: newProject.yearId,
                        user_id: userId
                    }]).then();
                } else {
                    // Link to the one we just inferred in this loop
                    t.projectId = alreadyInferred.id;
                }
            }
        }

        return {
            years: yearsRes.data.map((y) => y.id),
            projects: [...loadedProjects, ...inferredProjects],
            transactions: transactions,
            assets: assetsRes.data.map((a) => ({
                id: a.id,
                name: a.name,
                purchaseDate: a.purchase_date,
                cost: a.cost,
                land: a.land,
                priorDepreciation: a.prior_depreciation,
                projectId: a.project_id,
                // Defaults for missing columns
                type: 'Other',
                businessUsePercent: 100,
                usefulLife: 5,
                section179: false,
                bonusDepreciation: false,
                currentDepreciation: a.current_depreciation,
                method: a.method,
                convention: a.convention,
                // projectId: a.project_id, // Removed Duplicate
            })),
        };
    } catch (error) {
        console.error('Error loading user data:', error);
        throw error;
    }
}

/**
 * Sync years to Supabase
 */
export async function syncYears(userId: string, years: string[]) {
    try {
        // Delete years not in the current list
        const { data: existingYears } = await supabase
            .from('years')
            .select('id')
            .eq('user_id', userId);

        const yearsToDelete = existingYears
            ?.filter((y) => !years.includes(y.id))
            .map((y) => y.id) || [];

        if (yearsToDelete.length > 0) {
            await supabase
                .from('years')
                .delete()
                .eq('user_id', userId)
                .in('id', yearsToDelete);
        }

        // Upsert current years
        const yearRecords = years.map((year) => ({
            id: year,
            user_id: userId,
        }));

        const { error } = await supabase.from('years').upsert(yearRecords);
        if (error) throw error;
    } catch (error) {
        console.error('Error syncing years:', error);
        throw error;
    }
}

/**
 * Sync projects to Supabase
 */
export async function syncProjects(userId: string, projects: Project[]) {
    try {
        const projectRecords = projects.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            year_id: p.yearId,
            user_id: userId,
        }));

        const { error } = await supabase.from('projects').upsert(projectRecords);
        if (error) throw error;
    } catch (error) {
        console.error('Error syncing projects:', error);
        throw error;
    }
}

/**
 * Sync transactions to Supabase
 */
export async function syncTransactions(userId: string, transactions: Transaction[]) {
    try {
        const transactionRecords = transactions.map((t) => ({
            id: t.id,
            date: t.date,
            amount: t.amount,
            type: t.type,
            description: t.description,
            category: t.category,
            status: t.status,
            project_id: t.projectId,
            project_name: t.projectName, // Added
            user_id: userId,
            ny_source: t.nySource,
            pillar: t.pillar,
            interest: t.interest,
            capitalize: t.capitalize,
        }));

        const { error } = await supabase.from('ledger_entries').upsert(transactionRecords); // Correct Table

        if (error) {
            // Check for Foreign Key Violation (project_id doesn't exist in projects table)
            if (error.code === '23503') {
                console.warn("FK Violation on project_id. Retrying without project_id...");
                // Remove project_id and retry
                const fallbackRecords = transactionRecords.map(t => ({
                    ...t,
                    project_id: null // Clear invalid FK
                }));
                const { error: retryError } = await supabase.from('ledger_entries').upsert(fallbackRecords);
                if (retryError) throw retryError;
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error syncing transactions:', error);
        throw error;
    }
}

/**
 * Sync assets to Supabase
 */
export async function syncAssets(userId: string, assets: Asset[]) {
    try {
        const assetRecords = assets.map((a) => ({
            id: a.id,
            name: a.name,
            purchase_date: a.purchaseDate,
            cost: a.cost,
            land: a.land,
            prior_depreciation: a.priorDepreciation,
            current_depreciation: a.currentDepreciation,
            method: a.method,
            convention: a.convention,
            project_id: a.projectId,
            user_id: userId,
        }));

        const { error } = await supabase.from('assets').upsert(assetRecords);
        if (error) throw error;
    } catch (error) {
        console.error('Error syncing assets:', error);
        throw error;
    }
}

/**
 * Sync all user data to Supabase
 */
export async function syncAllData(userId: string, data: UserData) {
    await Promise.all([
        syncYears(userId, data.years),
        syncProjects(userId, data.projects),
        syncTransactions(userId, data.transactions),
        syncAssets(userId, data.assets),
    ]);
}

/**
 * Delete a transaction from Supabase
 */
export async function deleteTransaction(id: string) {
    const { error } = await supabase.from('ledger_entries').delete().eq('id', id);
    if (error) throw error;
}

/**
 * Delete an asset from Supabase
 */
export async function deleteAsset(id: string) {
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) throw error;
}

/**
 * Delete a project from Supabase (cascades to transactions and assets)
 */
export async function deleteProject(id: string) {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
}
