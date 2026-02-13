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
        <div className="mt-auto p-4 border-t border-border bg-yellow-50/50 dark:bg-yellow-900/10">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                Year-End Reminders
            </h3>
            <textarea
                className="w-full h-32 bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground/50"
                placeholder="Don't forget to deduct the home office..."
                value={note}
                onChange={handleChange}
                spellCheck={false}
            />
        </div>
    );
}
