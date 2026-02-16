'use client';

import { DashboardStats } from "@/components/DashboardStats";
import { RecentActivity } from "@/components/RecentActivity";
import { ExportButton } from "@/components/ExportButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { ProfitabilityRanking } from "@/components/ProfitabilityRanking";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import { TaxTips } from "@/components/TaxTips";
import { SyncStatusIndicator } from "@/components/SyncStatusIndicator";

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export default function Home() {
    const { loadFromDatabase, userId, setUserId } = useStore();

    useEffect(() => {
        // Data Persistence: Reload if missing (e.g. on refresh)
        const ADMIN_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

        // Always try to load on mount if we're supposed to be logged in
        // Since we ignore real auth for now, we force the admin user
        if (!userId || userId === 'admin') {
            setUserId(ADMIN_UUID);
            loadFromDatabase(ADMIN_UUID);
        } else {
            // Even if userId is set, maybe data is stale?
            // But usually store persists in memory. Validating logic:
            loadFromDatabase(userId);
        }
    }, [loadFromDatabase, setUserId, userId]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
                <div className="space-y-1">
                    <Breadcrumbs />
                    <h2 className="text-3xl font-bold tracking-tight text-sage-900 dark:text-sage-100">
                        Dashboard
                    </h2>
                </div>
                <div className="flex items-center space-x-2">
                    <SyncStatusIndicator />
                    <ProjectSwitcher />
                    <ExportButton />
                </div>
            </div>

            <div className="space-y-4">
                {/* 1. Key Metrics Row */}
                <DashboardStats />

                {/* 2. Main Analytics Row */}
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {/* Charts take up 5/7 columns */}
                    <div className="md:col-span-5">
                        <AnalyticsCharts />
                    </div>
                    {/* Tax Tips Side Panel - 2/7 columns */}
                    <div className="md:col-span-2">
                        <TaxTips />
                    </div>
                </div>

                {/* 3. Detailed Lists Row */}
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {/* Rankings - 4/7 */}
                    <div className="md:col-span-4">
                        <ProfitabilityRanking />
                    </div>
                    {/* Recent Activity - 3/7 */}
                    <div className="md:col-span-3">
                        <RecentActivity />
                    </div>
                </div>
            </div>
        </div>
    );
}
