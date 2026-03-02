'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, TrendingDown, FileText, Folder, Settings2, Upload, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StickyNote } from './StickyNote';
import { useStore } from '@/store/useStore';
import { useState } from 'react';
import { ProjectManager } from './ProjectManager';
import { ImportModal } from './ImportModal';
import { useUIStore } from '@/store/useUIStore';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Income', href: '/income', icon: TrendingUp },
    { name: 'Expenses', href: '/expenses', icon: TrendingDown },
    { name: 'Depreciation Schedule', href: '/assets', icon: FileText },
];

export function AppSidebar() {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    const { years, projects, selectedYear, selectedProjectId, setSelectedYear, setSelectedProject } = useStore();
    const { openManager } = useUIStore();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const x = (clientX / window.innerWidth - 0.5) * 15;
        const y = (clientY / window.innerHeight - 0.5) * 15;
        setMousePos({ x, y });
    };

    if (isLoginPage) return null;

    const handleYearClick = (year: string) => {
        if (selectedYear === year) {
            // Logic to toggle?
        } else {
            setSelectedYear(year);
        }
    };

    return (
        <aside
            className="hidden md:flex w-72 flex-col h-screen sticky top-0 border-r border-white/10 bg-black overflow-hidden group/sidebar"
            onMouseMove={handleMouseMove}
        >
            {/* Interactive Sidebar Background */}
            <div
                className="absolute inset-0 z-0 transition-transform duration-75 ease-out scale-110 pointer-events-none opacity-40 group-hover/sidebar:opacity-60 transition-opacity"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.1)`,
                    filter: 'blur(2px)'
                }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 pointer-events-none" />

            <div className="relative z-10 p-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[#2a9d8f] flex items-center justify-center shadow-lg shadow-[#2a9d8f]/20">
                        <LayoutDashboard className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter text-white">
                        Tax Ledger
                    </h1>
                </div>
                <div className="inline-block px-2 py-0.5 rounded-md bg-[#2a9d8f]/20 text-white text-[9px] font-black uppercase tracking-[0.2em]">
                    CVP Command Center
                </div>
            </div>

            <nav className="relative z-10 flex-1 px-4 space-y-8 overflow-y-auto pt-2 scrollbar-none">
                {/* 1. Main Views */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-white px-3 mb-2 uppercase tracking-[0.3em] opacity-80">Operational Views</h4>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 text-sm font-bold rounded-[1rem] transition-all duration-300",
                                    isActive
                                        ? "bg-white/15 backdrop-blur-md text-white shadow-xl ring-1 ring-white/30"
                                        : "text-white hover:bg-white/10"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-4.5 w-4.5",
                                    isActive
                                        ? (item.name === 'Expenses' ? "text-rose-500" : "text-[#2a9d8f]")
                                        : "text-white/60"
                                )} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                {/* 2. Global Hierarchy */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-3 mb-2 pt-4 border-t border-white/10">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-80">Ledger Hierarchy</h4>
                        <button
                            onClick={openManager}
                            className="text-white hover:text-[#2a9d8f] transition-all p-1 hover:rotate-90"
                            title="Configure Ledgers"
                        >
                            <Settings2 className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {years.map(year => {
                            const isYearActive = selectedYear === year;
                            const yearProjects = projects.filter(p => p.yearId === year);

                            return (
                                <div key={year} className="space-y-1">
                                    <button
                                        onClick={() => handleYearClick(year)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold rounded-xl transition-all",
                                            isYearActive
                                                ? "bg-[#2a9d8f]/20 text-white ring-1 ring-[#2a9d8f]/40"
                                                : "text-white hover:bg-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Folder className={cn("h-4.5 w-4.5", isYearActive ? "text-[#2a9d8f]" : "text-white/40")} />
                                            <span>{year}</span>
                                        </div>
                                        {isYearActive && (
                                            <span className="text-[9px] bg-[#2a9d8f] text-white px-2 py-0.5 rounded-full font-black">
                                                {yearProjects.length}
                                            </span>
                                        )}
                                    </button>

                                    {isYearActive && (
                                        <div className="ml-5 pl-4 border-l-2 border-white/10 space-y-1 mt-1">
                                            {yearProjects.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setSelectedProject(p.id)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-4 py-2 text-xs font-bold rounded-lg transition-all",
                                                        selectedProjectId === p.id
                                                            ? "text-[#2a9d8f] bg-white/10"
                                                            : "text-white hover:text-[#2a9d8f]/80"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                                                        p.type === 'Property' ? "bg-amber-500 shadow-amber-500/40" :
                                                            p.type === 'Client' ? "bg-blue-500 shadow-blue-500/40" : "bg-white/40"
                                                    )} />
                                                    <span className="truncate">{p.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </nav>

            <div className="relative z-10 mt-auto p-6 bg-black/50 backdrop-blur-2xl border-t border-white/10 space-y-3">
                <button
                    onClick={() => useUIStore.getState().openImport()}
                    className="w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-white hover:bg-white/10 rounded-2xl transition-all group"
                >
                    <Upload className="h-5 w-5 text-white/40 group-hover:text-[#2a9d8f] transition-colors" />
                    Sync Ledger
                </button>

                <button
                    onClick={() => useUIStore.getState().logout()}
                    className="w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                >
                    <LogOut className="h-5 w-5 opacity-40 group-hover:opacity-100" />
                    Terminate
                </button>

                <div className="pt-2 text-white">
                    <StickyNote />
                </div>
            </div>

            <ImportModal />
        </aside>
    );
}
