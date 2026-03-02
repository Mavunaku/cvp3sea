import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppSidebar } from '@/components/AppSidebar'
import { MobileNav } from '@/components/MobileNav'
import { MobileHeader } from '@/components/MobileHeader'
import { QuickAddModal } from '@/components/QuickAddModal'
import { NotesModal } from '@/components/NotesModal'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'TaxTrak - Simplified Bookkeeping',
    description: 'Bookkeeping for NY Freelancers and Rental Owners',
}

import { ProjectManager } from '@/components/ProjectManager'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={cn(inter.className, "bg-background text-foreground antialiased")}>
                <div className="flex min-h-screen flex-col md:flex-row">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                        <MobileHeader />
                        <main className="flex-1 pb-20 md:pb-0 overflow-y-auto h-screen">
                            {children}
                        </main>
                    </div>
                    <MobileNav />
                    <QuickAddModal />
                    <NotesModal />
                    <ProjectManager />
                </div>
            </body>
        </html>
    )
}
