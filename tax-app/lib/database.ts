import { supabase } from './supabase';
import { Transaction, Asset, Project, Entity, Member } from '@/types';

export interface UserData {
    years: string[];
    projects: Project[];
    transactions: Transaction[];
    assets: Asset[];
    members: Member[];
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

        // Fetched separately so a missing "members" table (before the
        // migration is run) doesn't break loading everything else.
        let members: Member[] = [];
        try {
            const membersRes = await supabase.from('members').select('*').eq('user_id', userId);
            if (membersRes.error) throw membersRes.error;
            members = membersRes.data.map((m) => ({
                id: m.id,
                name: m.name,
                ownershipPercent: m.ownership_percent,
            }));
        } catch (memberError) {
            console.warn('Could not load members (has the members migration been run?):', memberError);
        }

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
            capitalizeLife: t.capitalize_life ?? undefined,
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
            if (t.projectName && t.projectId) {
                const existing = loadedProjects.find(p => p.id === t.projectId);
                const alreadyInferred = inferredProjects.find(p => p.id === t.projectId);

                if (!existing && !alreadyInferred) {
                    // We found an orphaned transaction. 
                    // Try to infer the correct year from the date OR description
                    const dateYear = t.date.split('-')[0];
                    let yearId = dateYear;

                    // Accounting Specialist Hint: If description mentions a year like "2025", 
                    // and it's a catch-up entry, use that instead.
                    const yearMatch = t.description.match(/\b(20\d{2})\b/);
                    if (yearMatch && yearMatch[1] !== dateYear) {
                        console.log(`Inferred Year ${yearMatch[1]} from description "${t.description}" for catch-up entry.`);
                        yearId = yearMatch[1];
                    }

                    if (!yearId || yearId.length !== 4) yearId = new Date().getFullYear().toString();

                    const newProject: Project = {
                        id: t.projectId,
                        name: t.projectName,
                        type: 'Generic',
                        yearId: yearId
                    };
                    inferredProjects.push(newProject);

                    // Re-create missing project in DB
                    supabase.from('projects').upsert([{
                        id: t.projectId,
                        name: newProject.name,
                        type: newProject.type,
                        year_id: newProject.yearId,
                        user_id: userId
                    }]).then(({ error }) => {
                        if (error) console.error("Auto-restored missing project failed:", error);
                        else console.log("Auto-restored missing project:", newProject.name, "for year", yearId);
                    });

                    // Also ensure the year exists
                    supabase.from('years').upsert([{ id: yearId, user_id: userId }]).then();
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
                type: a.type ?? 'Other',
                businessUsePercent: a.business_use_percent ?? 100,
                usefulLife: a.useful_life ?? 5,
                section179: a.section_179 ?? false,
                bonusDepreciation: a.bonus_depreciation ?? false,
                currentDepreciation: a.current_depreciation,
                method: a.method,
                convention: a.convention,
                saleDate: a.sale_date ?? undefined,
                salePrice: a.sale_price ?? undefined,
                sellingCosts: a.selling_costs ?? undefined,
            })),
            members,
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
            capitalize_life: t.capitalizeLife ?? null,
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
            } else if (error.code === '42703') {
                // ledger_entries missing the capitalize_life column — run the
                // migration to persist per-item depreciation lives. Retry without it.
                console.warn('ledger_entries missing capitalize_life column — run the migration to persist per-improvement depreciation years. Falling back.');
                const fallbackRecords = transactionRecords.map(({ capitalize_life, ...rest }) => rest);
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
            type: a.type,
            purchase_date: a.purchaseDate,
            cost: a.cost,
            land: a.land,
            business_use_percent: a.businessUsePercent,
            useful_life: a.usefulLife,
            section_179: a.section179,
            bonus_depreciation: a.bonusDepreciation,
            prior_depreciation: a.priorDepreciation,
            current_depreciation: a.currentDepreciation,
            method: a.method,
            convention: a.convention,
            sale_date: a.saleDate || null,
            sale_price: a.salePrice ?? null,
            selling_costs: a.sellingCosts ?? null,
            project_id: a.projectId,
            user_id: userId,
        }));

        const { error } = await supabase.from('assets').upsert(assetRecords);

        if (error) {
            // 42703 = undefined_column. This happens if the newer asset columns
            // (config + disposition) haven't been migrated onto the live DB yet.
            // Fall back to the original base columns so saving still works, and
            // warn — the extra fields will start persisting once the migrations
            // (supabase_migration_asset_fields.sql + _disposition.sql) are run.
            if (error.code === '42703') {
                console.warn('Assets table missing newer columns — run the asset migrations to persist depreciation config & sale data. Falling back to base columns.');
                const baseRecords = assets.map((a) => ({
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
                const { error: retryError } = await supabase.from('assets').upsert(baseRecords);
                if (retryError) throw retryError;
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error syncing assets:', error);
        throw error;
    }
}

/**
 * Sync members to Supabase. Fails soft (logs only) if the "members" table
 * doesn't exist yet, so it doesn't block syncing everything else.
 */
export async function syncMembers(userId: string, members: Member[]) {
    try {
        const memberRecords = members.map((m) => ({
            id: m.id,
            name: m.name,
            ownership_percent: m.ownershipPercent,
            user_id: userId,
        }));

        const { error } = await supabase.from('members').upsert(memberRecords);
        if (error) throw error;
    } catch (error) {
        console.warn('Error syncing members (has the members migration been run?):', error);
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
        syncMembers(userId, data.members),
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

/**
 * Delete a member from Supabase
 */
export async function deleteMember(id: string) {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) throw error;
}
