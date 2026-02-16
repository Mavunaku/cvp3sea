'use client';

import { useUIStore } from '@/store/useUIStore';
import { X } from 'lucide-react';
import { StickyNote } from './StickyNote';
import { usePathname } from 'next/navigation';

export function NotesModal() {
    const pathname = usePathname();
    const { isNotesOpen, closeNotes } = useUIStore();

    if (pathname === '/login' || !isNotesOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-[#1a1c1e] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-lg font-black text-white uppercase tracking-widest">Global Notes</h2>
                    <button
                        onClick={closeNotes}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-white/40" />
                    </button>
                </div>

                <div className="p-6">
                    <StickyNote />
                    <p className="mt-4 text-[10px] text-white/30 text-center italic">
                        Notes are automatically saved and synced across devices.
                    </p>
                </div>
            </div>
        </div>
    );
}
