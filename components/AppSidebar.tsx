'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, TrendingDown, FileText, StickyNote as StickyNoteIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StickyNote } from './StickyNote';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Income', href: '/income', icon: TrendingUp },
    { name: 'Expenses', href: '/expenses', icon: TrendingDown },
    // { name: 'Reports', href: '/reports', icon: FileText }, // Future
];

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex w-64 flex-col border-r bg-sage-50/50 dark:bg-sage-950/30 h-screen sticky top-0">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight text-sage-900 dark:text-sage-100">
                    TaxTrak
                </h1>
                <p className="text-xs text-muted-foreground">NY Rental & Freelance</p>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-sage-200 text-sage-900 dark:bg-sage-800 dark:text-sage-50"
                                    : "text-muted-foreground hover:bg-sage-100 hover:text-sage-900 dark:hover:bg-sage-800/50 dark:hover:text-sage-50"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto">
                <StickyNote />
            </div>
        </aside>
    );
}
