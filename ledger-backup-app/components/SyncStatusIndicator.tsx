'use client';

import { useStore } from '@/store/useStore';
import { Cloud, CloudOff, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

export function SyncStatusIndicator() {
    const { isSyncing, lastSyncTime, syncError } = useStore();
    const [timeAgo, setTimeAgo] = useState('');

    useEffect(() => {
        if (!lastSyncTime) return;

        const updateTimeAgo = () => {
            const seconds = Math.floor((new Date().getTime() - new Date(lastSyncTime).getTime()) / 1000);

            if (seconds < 60) {
                setTimeAgo('just now');
            } else if (seconds < 3600) {
                const minutes = Math.floor(seconds / 60);
                setTimeAgo(`${minutes}m ago`);
            } else {
                const hours = Math.floor(seconds / 3600);
                setTimeAgo(`${hours}h ago`);
            }
        };

        updateTimeAgo();
        const interval = setInterval(updateTimeAgo, 10000); // Update every 10 seconds

        return () => clearInterval(interval);
    }, [lastSyncTime]);

    if (isSyncing) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400">
                <Cloud className="w-3.5 h-3.5 animate-pulse" />
                <span>Syncing...</span>
            </div>
        );
    }


    // Error State
    // const { syncError } = useStore(); // Was conditional, moved to top
    if (syncError) {
        return (
            <div className="group relative flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-xs text-red-500 cursor-help">
                <CloudOff className="w-3.5 h-3.5" />
                <span>Sync Error</span>

                {/* Tooltip */}
                <div className="absolute top-full right-0 mt-2 w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    {syncError}
                    {syncError.includes('policy') && (
                        <div className="mt-1 text-yellow-300 font-semibold">
                            ⚠️ Fix RLS in Dashboard!
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (lastSyncTime) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Synced {timeAgo}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-500/10 border border-slate-500/20 rounded-full text-xs text-slate-400">
            <CloudOff className="w-3.5 h-3.5" />
            <span>Not synced</span>
        </div>
    );
}
