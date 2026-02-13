'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, TrendingDown, PlusCircle, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Home', href: '/', icon: LayoutDashboard },
    { name: 'Income', href: '/income', icon: TrendingUp },
    { name: 'Add', href: '#', icon: PlusCircle, isAction: true }, // Placeholder for modal
    { name: 'Expenses', href: '/expenses', icon: TrendingDown },
    { name: 'Notes', href: '/notes', icon: StickyNote }, // Separate route for mobile notes?
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <div className="flex h-16 items-center justify-around px-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    if (item.isAction) {
                        return (
                            <button
                                key={item.href}
                                className="flex flex-col items-center justify-center -mt-6"
                                aria-label="Quick Add"
                            >
                                <div className="rounded-full bg-primary p-3 shadow-lg ring-4 ring-background transition-transform hover:scale-105 active:scale-95">
                                    <Icon className="h-6 w-6 text-primary-foreground" />
                                </div>
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-colors",
                                isActive
                                    ? "text-primary"
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
