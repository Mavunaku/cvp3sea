'use client';

import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FileWarning, ArrowRight, Briefcase, FileSignature, RefreshCcw } from 'lucide-react';

const tools = [
    {
        name: 'Notice of Security Deposit Itemization',
        description: 'Generate an official, print-ready itemized deduction letter for a departing tenant\'s security deposit — refund, zero-balance, or amount-owed, calculated automatically.',
        href: '/toolbox/security-deposit',
        icon: FileWarning,
        available: true,
    },
    {
        name: 'Residential Lease Agreement',
        description: 'Generate a full, print-ready residential lease contract — term, rent, deposit, occupants, pets, utilities, and standard clauses — from a short form.',
        href: '/toolbox/lease-agreement',
        icon: FileSignature,
        available: true,
    },
    {
        name: 'Notice of Lease Renewal',
        description: 'Offer a tenant a lease renewal, with or without a rent increase — auto-calculates the dollar and percentage change and flags large increases.',
        href: '/toolbox/lease-renewal',
        icon: RefreshCcw,
        available: true,
    },
];

export default function ToolboxPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6 pb-20">
            <Breadcrumbs />
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2a9d8f]/10 flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-[#2a9d8f]" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight italic">Landlord Toolbox</h2>
                </div>
                <p className="text-sm text-slate-500 max-w-2xl">
                    Official, ready-to-send documents and calculators for managing your rental properties.
                    Fill out a short form and get a professional, print-ready result.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {tools.map(tool => (
                    <Link
                        key={tool.href}
                        href={tool.href}
                        className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-[#2a9d8f]/40 transition-all p-6 flex flex-col"
                    >
                        <div className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-[#2a9d8f] transition-colors">
                            <tool.icon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white leading-snug">{tool.name}</h3>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed flex-1">{tool.description}</p>
                        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#2a9d8f] mt-4">
                            Open Tool <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}

                <div className="relative bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center opacity-70">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">More Tools Coming Soon</p>
                    <p className="text-[11px] text-slate-400 mt-1.5">Move-in/move-out checklists, late rent notices, and more.</p>
                </div>
            </div>
        </div>
    );
}
