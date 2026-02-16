'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, TrendingDown, PlusCircle, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';

export function MobileNav() {
    const pathname = usePathname();
    const { openQuickAdd, openNotes } = useUIStore();

    if (pathname === '/login') return null;

    const navItems = [
        { name: 'Home', href: '/', icon: LayoutDashboard },
        { name: 'Income', href: '/income', icon: TrendingUp },
        { name: 'Add', href: '#', icon: PlusCircle, isAction: true, action: openQuickAdd },
        { name: 'Expenses', href: '/expenses', icon: TrendingDown },
        { name: 'Depreciation', href: '/assets', icon: StickyNote }, // Changed from Notes to Depreciation
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <div className="flex h-16 items-center justify-around px-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    if (item.isAction) {
                        const isPrimary = item.name === 'Add';
                        return (
                            <button
                                key={item.name}
                                onClick={item.action}
                                className={cn(
                                    "flex flex-col items-center justify-center transition-all active:scale-95",
                                    isPrimary ? "-mt-6" : "gap-1"
                                )}
                                aria-label={item.name}
                            >
                                {isPrimary ? (
                                    <div className="rounded-full bg-[#2a9d8f] p-3 shadow-lg ring-4 ring-background">
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                ) : (
                                    <>
                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-[10px] font-medium text-muted-foreground">{item.name}</span>
                                    </>
                                )}
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-colors",
                                isActive
                                    ? "text-[#2a9d8f]"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
