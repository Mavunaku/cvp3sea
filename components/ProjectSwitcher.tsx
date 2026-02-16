'use client';

import { useStore } from '@/store/useStore';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Folder, Building2, Briefcase, Archive } from 'lucide-react';

export function ProjectSwitcher() {
    const { years, projects, selectedYear, selectedProjectId, setSelectedYear, setSelectedProject } = useStore();

    // Flatten logic: If a project is selected, value is `p-${projectId}`.
    // If only year is selected, value is `y-${year}`.
    // If nothing, value is "global".

    const currentValue = selectedProjectId
        ? `p-${selectedProjectId}`
        : selectedYear
            ? `y-${selectedYear}`
            : "global";

    const handleValueChange = (val: string) => {
        if (val === "global") {
            setSelectedYear(null);
            setSelectedProject(null);
        } else if (val.startsWith("y-")) {
            const year = val.replace("y-", "");
            setSelectedYear(year);
            // reset project is handled by store or we do it explicitly? 
            // store sets project to null when year changes, but let's be safe.
        } else if (val.startsWith("p-")) {
            const pid = val.replace("p-", "");
            const project = projects.find(p => p.id === pid);
            if (project) {
                if (project.yearId !== selectedYear) {
                    setSelectedYear(project.yearId);
                }
                setSelectedProject(pid);
            }
        }
    };

    return (
        <div className="w-[260px]">
            <Select value={currentValue} onValueChange={handleValueChange}>
                <SelectTrigger className="h-9 w-full bg-white/50 dark:bg-slate-900/50 border-sage-200 dark:border-sage-800">
                    <SelectValue placeholder="Select Context..." />
                </SelectTrigger>
                <SelectContent className="max-h-[500px]">
                    <SelectItem value="global">
                        <div className="flex items-center gap-2">
                            <Archive className="h-4 w-4 text-indigo-500" />
                            <span className="font-semibold">Global Dashboard</span>
                        </div>
                    </SelectItem>

                    {years.map(year => {
                        const yearProjects = projects.filter(p => p.yearId === year);
                        return (
                            <SelectGroup key={year}>
                                <SelectLabel className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/30 px-2 py-1 mt-1">
                                    <Folder className="h-3 w-3" /> {year}
                                </SelectLabel>
                                {/* Option to select just the Year Folder? Maybe "All 2026" */}
                                <SelectItem value={`y-${year}`} className="pl-6 font-medium text-muted-foreground italic">
                                    All of {year}
                                </SelectItem>
                                {yearProjects.map(p => (
                                    <SelectItem key={p.id} value={`p-${p.id}`} className="pl-6">
                                        <div className="flex items-center gap-2">
                                            {p.type === 'Property' ? <Building2 className="h-3 w-3 text-amber-500" /> :
                                                p.type === 'Client' ? <Briefcase className="h-3 w-3 text-blue-500" /> :
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                                            <span>{p.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
}
