'use client';

import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, DollarSign, Scale } from 'lucide-react';

export function TaxTips() {
    const { projects, selectedProjectId } = useStore();

    // Determine context
    const project = projects.find(p => p.id === selectedProjectId);
    const type = project?.type || 'Generic';

    const renderTips = () => {
        return (
            <div className="space-y-5">
                {/* 1. The #1 Rule */}
                <div className="flex gap-4 items-start">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-xl shrink-0"><Scale className="h-4 w-4 text-rose-600" /></div>
                    <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Separation of &quot;Church &amp; State&quot;</h4>
                        <p className="text-[11px] leading-relaxed text-muted-foreground mt-1">Never use one bank account for personal and business. It is the #1 audit trigger and makes your tax prep 100x harder.</p>
                    </div>
                </div>

                {/* 2. Receipt Rule */}
                <div className="flex gap-4 items-start">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl shrink-0"><Scale className="h-4 w-4 text-blue-600" /></div>
                    <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">The Digital Receipt Shield</h4>
                        <p className="text-[11px] leading-relaxed text-muted-foreground mt-1">IRS accepts photos. Snap every repair or supply purchase immediately. Digital proof is your best shield in an audit.</p>
                    </div>
                </div>

                {/* 3. Project Specific Strategy */}
                {type === 'Property' ? (
                    <div className="flex gap-4 items-start">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl shrink-0"><TrendingUp className="h-4 w-4 text-emerald-600" /></div>
                        <div>
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Depreciation (Free Money)</h4>
                            <p className="text-[11px] leading-relaxed text-muted-foreground mt-1">Write off the building value over 27.5 years. It lowers your taxes even if your property value is actually rising.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-4 items-start">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl shrink-0"><DollarSign className="h-4 w-4 text-indigo-600" /></div>
                        <div>
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Beat the &quot;April Surprise&quot;</h4>
                            <p className="text-[11px] leading-relaxed text-muted-foreground mt-1">Set aside 30% of every payment for taxes. Paying quarterly prevents huge fees and stressful year-end bills.</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card className="h-full bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                    <Lightbulb className="h-5 w-5" />
                    Tax Tips: {type === 'Property' ? 'Rental' : type === 'Client' ? 'Freelance' : 'General'}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
                {renderTips()}
            </CardContent>
        </Card>
    );
}
