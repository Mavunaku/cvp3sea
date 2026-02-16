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
        const transactions = transactionsRes.data.map((t) => ({
            id: t.id,
            date: t.date,
            amount: t.amount,
            type: t.type,
            description: t.description,
            category: t.category,
            status: (t.status || 'Cleared') as Transaction['status'], // Default to Cleared
            entity: 'CVP' as Entity, // Default Entity
            projectId: t.project_id,
            projectName: t.project_name, // Mapped
            nySource: t.ny_source,
            pillar: t.pillar,
            interest: t.interest,
            capitalize: t.capitalize,
            capitalizeUsefulLife: t.capitalize_useful_life,
        }));

        // Helper for UUID
        const generateUUID = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };

        // Infer Projects from Transactions if missing
        const inferredProjects: Project[] = [];

        // We use a simple loop to find missing projects and auto-create them
        for (const t of transactions) {
            if (t.projectName) {
                const existing = loadedProjects.find(p => p.name === t.projectName);
                const alreadyInferred = inferredProjects.find(p => p.name === t.projectName);

                if (!existing && !alreadyInferred) {
                    // Check if there is really no project with this name
                    // Create synthetic project AND Persist it
                    const newId = generateUUID();
                    const currentYear = new Date().getFullYear().toString();

                    const newProject: Project = {
                        id: newId,
                        name: t.projectName,
                        type: 'Generic',
                        yearId: currentYear
                    };
                    inferredProjects.push(newProject);

                    // Self-Healing: Create the project in DB so future inserts work
                    // utilizing async execution (fire and forget)
                    supabase.from('projects').upsert([{
                        id: newId,
                        name: newProject.name,
                        type: newProject.type,
                        year_id: newProject.yearId,
                        user_id: userId
                    }]).then(({ error }) => {
                        if (error) console.error("Auto-created missing project failed:", error);
                        else console.log("Auto-created missing project:", newProject.name);
                    });
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
                type: a.type || 'Other',
                businessUsePercent: a.business_use_percent || 100,
                usefulLife: a.useful_life || 5,
                section179: a.section179 || false,
                bonusDepreciation: a.bonus_depreciation || false,
                currentDepreciation: a.current_depreciation,
                method: a.method,
                convention: a.convention,
                notes: a.notes,
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
            capitalize_useful_life: t.capitalizeUsefulLife,
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
            type: a.type,
            business_use_percent: a.businessUsePercent,
            useful_life: a.usefulLife,
            section179: a.section179,
            bonus_depreciation: a.bonusDepreciation,
            notes: a.notes,
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
