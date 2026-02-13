'use client';

import { DashboardStats } from "@/components/DashboardStats";
import { RecentActivity } from "@/components/RecentActivity";

export default function Home() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-sage-900 dark:text-sage-100">
                    Dashboard
                </h2>
                <div className="flex items-center space-x-2">
                    {/* Future: Date Range Picker or Export Button */}
                </div>
            </div>
            <div className="space-y-4">
                <DashboardStats />
                <RecentActivity />
            </div>
        </div>
    );
}
