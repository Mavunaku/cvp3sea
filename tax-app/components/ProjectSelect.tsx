'use client';

import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { Project } from '@/types';

interface ProjectSelectProps {
    value?: string;
    onChange: (projectId: string) => void;
    className?: string;
}

export function ProjectSelect({ value, onChange, className }: ProjectSelectProps) {
    const { projects, years } = useStore();

    return (
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
                "h-8 w-full rounded border border-transparent bg-transparent px-2 py-1 text-sm hover:border-sage-300 focus:border-sage-500 focus:outline-none dark:hover:border-sage-700",
                !value && "text-muted-foreground italic",
                className
            )}
            title="Assign to Folder (Project)"
        >
            <option value="" disabled>Select Folder...</option>
            {years.map(year => {
                const yearProjects = projects.filter(p => p.yearId === year);
                // Ensure there is at least a visual indication if no projects exist, though we can't select empty optgroup
                if (yearProjects.length === 0) return null;

                return (
                    <optgroup key={year} label={year}>
                        {yearProjects.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name === 'General' || p.name === 'Uncategorized' ? `📂 ${year} (General)` : p.name}
                            </option>
                        ))}
                    </optgroup>
                );
            })}
        </select>
    );
}
