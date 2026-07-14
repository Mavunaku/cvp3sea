'use client';

import { useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Member } from '@/types';
import { Plus, Trash2, Download, Upload, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

type Preset = 'single' | 'fiftyFifty' | 'custom';

function presetFromMembers(members: Member[]): Preset {
    if (members.length === 2 && members.every(m => Math.abs(m.ownershipPercent - 50) < 0.01)) {
        return 'fiftyFifty';
    }
    if (members.length <= 1) return 'single';
    return 'custom';
}

export function MemberManager() {
    const { members, setMembers } = useStore();
    const [preset, setPreset] = useState<Preset>(presetFromMembers(members));
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalOwnership = members.reduce((sum, m) => sum + (m.ownershipPercent || 0), 0);
    const isBalanced = members.length === 0 || Math.abs(totalOwnership - 100) < 0.01;

    const handlePresetChange = (next: Preset) => {
        setPreset(next);
        if (next === 'single') {
            setMembers([{ id: members[0]?.id || uuidv4(), name: members[0]?.name || 'Owner', ownershipPercent: 100 }]);
        } else if (next === 'fiftyFifty') {
            setMembers([
                { id: members[0]?.id || uuidv4(), name: members[0]?.name || 'Member 1', ownershipPercent: 50 },
                { id: members[1]?.id || uuidv4(), name: members[1]?.name || 'Member 2', ownershipPercent: 50 },
            ]);
        }
        // 'custom' leaves the current list as-is for the user to edit freely.
    };

    const handleAddMember = () => {
        setMembers([...members, { id: uuidv4(), name: `Member ${members.length + 1}`, ownershipPercent: 0 }]);
    };

    const handleUpdateMember = (id: string, updates: Partial<Member>) => {
        setMembers(members.map(m => (m.id === id ? { ...m, ...updates } : m)));
    };

    const handleDeleteMember = (id: string) => {
        setMembers(members.filter(m => m.id !== id));
    };

    const handleExport = () => {
        const blob = new Blob([JSON.stringify({ members }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `taxtrak_members_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result as string);
                const importedMembers: Member[] = Array.isArray(parsed) ? parsed : parsed.members;

                if (!Array.isArray(importedMembers)) {
                    throw new Error('File must contain a "members" array.');
                }

                const normalized: Member[] = importedMembers.map((m: any) => ({
                    id: m.id || uuidv4(),
                    name: String(m.name || 'Member'),
                    ownershipPercent: Number(m.ownershipPercent) || 0,
                }));

                setMembers(normalized);
                setPreset(presetFromMembers(normalized));
            } catch (err: any) {
                alert(`Could not import members file: ${err.message || err}`);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // allow re-importing the same file later
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                        <Users className="h-5 w-5 text-indigo-500 pointer-events-none" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">LLC Members / K-1 Allocation</h3>
                        <p className="text-xs text-muted-foreground">
                            0-1 members uses the Schedule C preview. 2+ members enables K-1 allocation by ownership %.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        disabled={members.length === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download className="h-3.5 w-3.5 pointer-events-none" />
                        Export
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-lg hover:bg-muted"
                    >
                        <Upload className="h-3.5 w-3.5 pointer-events-none" />
                        Import
                    </button>
                    <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Structure</label>
                <select
                    value={preset}
                    onChange={(e) => handlePresetChange(e.target.value as Preset)}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                >
                    <option value="single">Single Member (Schedule C, no K-1)</option>
                    <option value="fiftyFifty">2 Members, 50 / 50</option>
                    <option value="custom">Custom (any number of members)</option>
                </select>
            </div>

            <div className="space-y-2">
                {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
                        <input
                            type="text"
                            value={member.name}
                            onChange={(e) => handleUpdateMember(member.id, { name: e.target.value })}
                            placeholder="Member name"
                            className="flex-1 px-2 py-1.5 text-sm border rounded"
                        />
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.01}
                                value={member.ownershipPercent}
                                onChange={(e) => handleUpdateMember(member.id, { ownershipPercent: Number(e.target.value) })}
                                className="w-20 px-2 py-1.5 text-sm border rounded text-right"
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                        </div>
                        {preset === 'custom' && (
                            <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                                title="Remove member"
                            >
                                <Trash2 className="h-4 w-4 pointer-events-none" />
                            </button>
                        )}
                    </div>
                ))}

                {members.length === 0 && (
                    <p className="text-sm text-muted-foreground italic p-2">
                        No members configured — treated as a single-member entity (Schedule C).
                    </p>
                )}

                {preset === 'custom' && (
                    <button
                        onClick={handleAddMember}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold border border-dashed rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <Plus className="h-4 w-4 pointer-events-none" />
                        Add Member
                    </button>
                )}
            </div>

            {members.length > 0 && (
                <div className={cn(
                    "flex items-center gap-2 text-xs font-bold p-3 rounded-lg",
                    isBalanced ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                )}>
                    {isBalanced ? <CheckCircle2 className="h-4 w-4 pointer-events-none" /> : <AlertTriangle className="h-4 w-4 pointer-events-none" />}
                    Total ownership: {totalOwnership.toFixed(2)}%
                    {!isBalanced && ' — should add up to 100% before generating K-1 allocations.'}
                </div>
            )}
        </div>
    );
}
