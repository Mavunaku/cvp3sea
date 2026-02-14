'use client';

import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, DollarSign } from 'lucide-react';

export function TaxTips() {
    const { projects, selectedProjectId } = useStore();

    // Determine context
    const project = projects.find(p => p.id === selectedProjectId);
    const type = project?.type || 'Generic';

    const renderTips = () => {
        switch (type) {
            case 'Property':
                return (
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="mt-1"><TrendingUp className="h-4 w-4 text-emerald-500" /></div>
                            <div>
                                <h4 className="font-semibold text-sm">Depreciation is Key</h4>
                                <p className="text-xs text-muted-foreground">Don&apos;t forget to track all capital improvements (roof, HVAC). These are depreciated over 27.5 years, not deducted immediately.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="mt-1"><DollarSign className="h-4 w-4 text-amber-500" /></div>
                            <div>
                                <h4 className="font-semibold text-sm">Passive Loss Rules</h4>
                                <p className="text-xs text-muted-foreground">Rental losses may be limited if your income &gt; $100k, unless you are a Real Estate Professional.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'Client': // Freelance
                return (
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="mt-1"><TrendingUp className="h-4 w-4 text-blue-500" /></div>
                            <div>
                                <h4 className="font-semibold text-sm">Self-Employment Tax</h4>
                                <p className="text-xs text-muted-foreground">Remember you owe ~15.3% SE tax on net profit. Track every business expense to lower this!</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="mt-1"><DollarSign className="h-4 w-4 text-emerald-500" /></div>
                            <div>
                                <h4 className="font-semibold text-sm">Home Office Deduction</h4>
                                <p className="text-xs text-muted-foreground">If you work from home exclusively for this client, calculating home office % can save thousands.</p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="mt-1"><Lightbulb className="h-4 w-4 text-amber-500" /></div>
                            <div>
                                <h4 className="font-semibold text-sm">General Strategy</h4>
                                <p className="text-xs text-muted-foreground">Keep business and personal funds separate. reconciling monthly ensures you never miss a deduction.</p>
                            </div>
                        </div>
                    </div>
                );
        }
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
