'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface EditableCellProps {
    value: string | number;
    type?: 'text' | 'number' | 'date';
    onSave: (value: string | number) => void;
    className?: string;
}

export function EditableCell({ value, type = 'text', onSave, className }: EditableCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (currentValue !== value) {
            onSave(type === 'number' ? parseFloat(currentValue.toString()) : currentValue);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setCurrentValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    if (isEditing) {
        return (
            <div className="flex items-center space-x-1">
                <input
                    ref={inputRef}
                    type={type}
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        "w-full rounded border border-sage-300 px-2 py-1 text-sm focus:border-sage-500 focus:outline-none dark:border-sage-700 dark:bg-sage-900",
                        className
                    )}
                />
            </div>
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={cn(
                "cursor-pointer rounded px-2 py-1 hover:bg-sage-100 dark:hover:bg-sage-800/50 min-h-[28px]",
                !value && "text-muted-foreground italic",
                className
            )}
        >
            {type === 'number' && typeof value === 'number'
                ? `$${value.toFixed(2)}`
                : value || 'Click to edit'}
        </div>
    );
}
