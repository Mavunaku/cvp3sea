'use client';

import { useStore } from '@/store/useStore';
import { usePathname } from 'next/navigation';
import { ChevronDown, Folder, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function MobileHeader() {
    const pathname = usePathname();
    const { years, projects, selectedYear, selectedProjectId, setSelectedProject, setSelectedYear } = useStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (pathname === '/login') return null;

    const currentProject = projects.find(p => p.id === selectedProjectId);
    const title = currentProject ? currentProject.name : (selectedYear || 'Select Project');

    return (
        <header className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-xl border-b border-white/10 md:hidden">
            <div className="flex flex-col">
                <div className="flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#2a9d8f] flex items-center justify-center shadow-lg shadow-[#2a9d8f]/20">
                            <Home className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-[10px] font-black text-[#2a9d8f] uppercase tracking-widest">Tax Ledger</span>
                            <span className="text-sm font-bold text-white truncate max-w-[150px]">
                                {title}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white transition-all active:scale-95"
                    >
                        Switch Folder
                        <ChevronDown className={cn("h-3 w-3 transition-transform", isMenuOpen && "rotate-180")} />
                    </button>
                </div>

                {/* Mobile Project Selector Overlay */}
                {isMenuOpen && (
                    <div className="bg-black/95 border-b border-white/10 max-h-[60vh] overflow-y-auto animate-in slide-in-from-top duration-200">
                        <div className="p-4 space-y-6 pb-12">
                            {years.map(year => (
                                <div key={year} className="space-y-2">
                                    <button
                                        onClick={() => {
                                            setSelectedYear(year);
                                            // Don't close yet if they might want to pick a project? 
                                            // Actually usually picking a year is enough to see year-level stats.
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]",
                                            selectedYear === year ? "text-[#2a9d8f]" : "text-white/40"
                                        )}
                                    >
                                        <Folder className="h-3 w-3" />
                                        {year}
                                    </button>
                                    <div className="grid grid-cols-1 gap-1">
                                        {projects.filter(p => p.yearId === year).map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => {
                                                    setSelectedProject(p.id);
                                                    setIsMenuOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all",
                                                    selectedProjectId === p.id
                                                        ? "bg-[#2a9d8f]/20 text-white ring-1 ring-[#2a9d8f]/40"
                                                        : "text-white/60 active:bg-white/5"
                                                )}
                                            >
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
