'use client';

import { useStore } from '@/store/useStore';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming generic utility
import { Project } from '@/types';

export function Breadcrumbs() {
    const {
        selectedYear,
        selectedProjectId,
        years,
        projects,
        setSelectedYear,
        setSelectedProject
    } = useStore();

    // Resolve Names
    const activeProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

    // Handlers
    const goHome = () => {
        setSelectedYear(null);
        setSelectedProject(null);
    };

    const goYear = () => {
        setSelectedProject(null);
    };

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <button
                onClick={goHome}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
                <Home className="h-4 w-4" />
                <span className="font-medium">Overview</span>
            </button>

            {selectedYear && (
                <>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                    <button
                        onClick={goYear}
                        className={cn(
                            "hover:text-foreground transition-colors",
                            !selectedProjectId && "font-semibold text-foreground underline decoration-indigo-500/50 underline-offset-4"
                        )}
                    >
                        {selectedYear}
                    </button>
                </>
            )}

            {activeProject && (
                <>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                    <span
                        className="font-semibold text-foreground underline decoration-emerald-500/50 underline-offset-4"
                    >
                        {activeProject.name}
                    </span>
                </>
            )}
        </div>
    );
}
