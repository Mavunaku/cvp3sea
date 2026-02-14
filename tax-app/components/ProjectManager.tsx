'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Plus, Trash2, Edit2, X, Folder, Briefcase, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project } from '@/types';
import { RescueCenter } from './RescueCenter';

import { useUIStore } from '@/store/useUIStore';

export function ProjectManager() {
    const { isManagerOpen: isOpen, closeManager: onClose } = useUIStore();
    const { years, projects, addYear, deleteYear, addProject, deleteProject, editProject } = useStore();
    const [activeTab, setActiveTab] = useState<'hierarchy' | 'rescue'>('hierarchy');
    const [newYear, setNewYear] = useState('');
    const [selectedYearForProjects, setSelectedYearForProjects] = useState<string | null>(null);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectType, setNewProjectType] = useState<'Property' | 'Client' | 'Generic'>('Property');
    const [editingProject, setEditingProject] = useState<string | null>(null); // ID of project being edited

    if (!isOpen) return null;

    const handleAddYear = (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (newYear && !years.includes(newYear)) {
            addYear(newYear);
            setSelectedYearForProjects(newYear); // Auto-select for immediate persistence feeling
            setNewYear('');
        }
    };

    const handleAddProject = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (newProjectName && selectedYearForProjects) {
            addProject({
                name: newProjectName,
                type: newProjectType,
                yearId: selectedYearForProjects
            });
            setNewProjectName('');
        }
    };

    const currentProjects = projects.filter(p => p.yearId === selectedYearForProjects);

    return (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center">
            {/* Backdrop Blur Layer - Sibling to avoid hit-test interception */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
                onMouseMove={(e) => e.stopPropagation()}
            />

            {/* Modal Box */}
            <div
                className="relative z-10 w-[800px] h-[600px] bg-background rounded-lg shadow-xl border overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                <Folder className="h-5 w-5 text-indigo-500 pointer-events-none" />
                            </div>
                            <h2 className="text-xl font-bold">Command Center</h2>
                        </div>

                        <div className="h-8 w-px bg-border mx-2" />

                        <div className="flex bg-muted p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('hierarchy')}
                                className={cn(
                                    "px-3 py-1 text-xs font-bold rounded-md transition-all",
                                    activeTab === 'hierarchy' ? "bg-background shadow-sm text-indigo-600" : "opacity-50 hover:opacity-100"
                                )}
                            >
                                Hierarchy
                            </button>
                            <button
                                onClick={() => setActiveTab('rescue')}
                                className={cn(
                                    "px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5",
                                    activeTab === 'rescue' ? "bg-background shadow-sm text-amber-600" : "opacity-50 hover:opacity-100"
                                )}
                            >
                                <ShieldAlert className="h-3 w-3 pointer-events-none" />
                                Data Rescue
                            </button>
                        </div>
                    </div>

                    <button onClick={onClose} className="relative z-20 p-1 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5 pointer-events-none" />
                    </button>
                </div>

                {activeTab === 'hierarchy' ? (
                    <div className="flex flex-1 overflow-hidden">
                        {/* LEFT COLUMN: YEARS */}
                        <div className="w-1/3 border-r p-4 bg-muted/10 flex flex-col gap-4">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Fiscal Years</h3>

                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="2000"
                                    max="2099"
                                    placeholder="Year (e.g. 2026)"
                                    value={newYear}
                                    onChange={(e) => setNewYear(e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border rounded"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddYear()}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddYear}
                                    disabled={!newYear || years.includes(newYear)}
                                    className="relative z-30 p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Add Fiscal Year"
                                >
                                    <Plus className="h-4 w-4 pointer-events-none" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-1">
                                {years.map(year => (
                                    <div
                                        key={year}
                                        onClick={() => setSelectedYearForProjects(year)}
                                        className={cn(
                                            "group flex items-center justify-between p-2 rounded cursor-pointer text-sm transition-colors",
                                            selectedYearForProjects === year ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100" : "hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Folder className="h-4 w-4 opacity-50 pointer-events-none" />
                                            <span>{year}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Are you sure you want to delete the fiscal year ${year}? This will also delete all projects, transactions, and assets linked to this year.`)) {
                                                    deleteYear(year);
                                                }
                                            }}
                                            className="relative z-20 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-3 w-3 pointer-events-none" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: PROJECTS */}
                        <div className="flex-1 p-4 flex flex-col gap-4">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                                Projects for {selectedYearForProjects || '...'}
                            </h3>

                            {!selectedYearForProjects ? (
                                <div className="flex-1 flex items-center justify-center text-muted-foreground italic text-sm">
                                    Select a specific Year to manage its projects.
                                </div>
                            ) : (
                                <>
                                    <div className="flex gap-2 items-end border-b pb-4">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-xs font-medium">Project Name</label>
                                            <input
                                                type="text"
                                                value={newProjectName}
                                                onChange={(e) => setNewProjectName(e.target.value)}
                                                placeholder="e.g. 67 Grand Blvd"
                                                className="w-full px-2 py-1.5 text-sm border rounded"
                                            />
                                        </div>
                                        <div className="w-32 space-y-1">
                                            <label className="text-xs font-medium">Type</label>
                                            <select
                                                value={newProjectType}
                                                onChange={(e) => setNewProjectType(e.target.value as any)}
                                                className="w-full px-2 py-1.5 text-sm border rounded"
                                            >
                                                <option value="Property">Property</option>
                                                <option value="Client">Client</option>
                                                <option value="Generic">Generic</option>
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddProject}
                                            disabled={!newProjectName}
                                            className="relative z-30 mb-[1px] px-3 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            Add Project
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-2">
                                        {currentProjects.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic p-2">No projects defined for {selectedYearForProjects}.</p>
                                        ) : (
                                            currentProjects.map(project => (
                                                <div key={project.id} className="flex items-center justify-between p-3 border rounded-md bg-card hover:shadow-sm transition-shadow">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                                                            project.type === 'Property' ? "bg-amber-100 text-amber-700" :
                                                                project.type === 'Client' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                                                        )}>
                                                            {project.type[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-sm">{project.name}</div>
                                                            <div className="text-[10px] text-muted-foreground uppercase">{project.type}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm(`Delete project "${project.name}" and all its linked transactions/assets?`)) {
                                                                    deleteProject(project.id);
                                                                }
                                                            }}
                                                            className="relative z-20 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                                                            title="Delete Project"
                                                        >
                                                            <Trash2 className="h-4 w-4 pointer-events-none" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 p-8 overflow-y-auto">
                        <RescueCenter />
                    </div>
                )}
            </div>
        </div>
    );
}
