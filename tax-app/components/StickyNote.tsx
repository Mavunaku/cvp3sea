'use client';

import { useState, useEffect } from 'react';

export function StickyNote() {
    const [note, setNote] = useState('');

    useEffect(() => {
        const savedNote = localStorage.getItem('tax-app-sticky-note');
        if (savedNote) setNote(savedNote);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setNote(newValue);
        localStorage.setItem('tax-app-sticky-note', newValue);
    };

    return (
        <div className="mt-auto p-4 border-t border-white/10 bg-white/5 rounded-2xl backdrop-blur-sm shadow-inner group/note">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2 opacity-90 group-hover/note:opacity-100 transition-opacity">
                <span className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                Year-End Reminders
            </h3>
            <textarea
                className="w-full h-32 bg-transparent text-sm text-white/90 resize-none focus:outline-none placeholder:text-white/20 transition-all"
                placeholder="Don't forget to deduct the home office..."
                value={note}
                onChange={handleChange}
                spellCheck={false}
            />
        </div>
    );
}
