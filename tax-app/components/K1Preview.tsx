'use client';

import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';
import { calculateStats, calculateMemberAllocations } from '@/lib/calculations';

export function K1Preview() {
    const { transactions, assets, projects, members, selectedYear, selectedProjectId } = useStore();

    const stats = useMemo(() => {
        return calculateStats(transactions, assets, projects, selectedYear, selectedProjectId);
    }, [transactions, assets, projects, selectedYear, selectedProjectId]);

    const allocations = useMemo(() => {
        return calculateMemberAllocations(stats, members);
    }, [stats, members]);

    return (
        <Card className="max-w-4xl mx-auto bg-white dark:bg-slate-950 border-double border-4 border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b bg-slate-50 dark:bg-slate-900/50">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tighter uppercase">K-1 Allocations</CardTitle>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Form 1065 | Schedule K-1 Preview, per Member</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold">{selectedYear || 'All Time'}</div>
                        <p className="text-[8px] text-muted-foreground uppercase">Estimated Preview Only</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-4 text-xs font-bold uppercase tracking-tighter text-center">
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <div className="text-muted-foreground">Ordinary/Rental Income</div>
                        <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                            ${(stats.taxableNetProfit + stats.section179Total).toLocaleString()}
                        </div>
                    </div>
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <div className="text-muted-foreground">Sec 179 (Box 12)</div>
                        <div className="text-lg font-black text-blue-700 dark:text-blue-400">
                            ${stats.section179Total.toLocaleString()}
                        </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="text-muted-foreground">Members</div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-100">{members.length}</div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/20">
                            <tr>
                                <th className="px-4 py-3 text-left font-bold text-slate-600">Member</th>
                                <th className="px-4 py-3 text-right font-bold text-slate-600">Ownership</th>
                                <th className="px-4 py-3 text-right font-bold text-slate-600">Box 1/2: Ordinary Income</th>
                                <th className="px-4 py-3 text-right font-bold text-slate-600">Box 12: Sec 179</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {allocations.map((a) => (
                                <tr key={a.memberId}>
                                    <td className="px-4 py-3 font-semibold">{a.memberName}</td>
                                    <td className="px-4 py-3 text-right font-mono">{a.ownershipPercent}%</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold">${a.allocatedOrdinaryIncome.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-mono text-blue-600">${a.allocatedSection179.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                    <p className="text-[10px] text-amber-800/70 dark:text-amber-400/70 leading-relaxed">
                        Rental real estate income passed through on a K-1 (Box 2) is generally <strong>not</strong> subject
                        to self-employment tax, unlike active trade/business income (Box 1) — the dashboard&apos;s
                        &quot;What You Owe&quot; estimate already excludes rental income from its SE tax calculation, but
                        it is a combined-entity estimate and does not allocate per-member. Each member&apos;s actual tax
                        liability depends on their individual return (other income, filing status, basis limitations,
                        passive loss carryovers) and should be computed by a licensed tax professional, not this preview.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
