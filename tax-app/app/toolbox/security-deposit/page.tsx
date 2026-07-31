'use client';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SecurityDepositItemization } from '@/components/SecurityDepositItemization';

export default function SecurityDepositPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6 pb-20 print:p-0 print:space-y-0">
            <div className="print:hidden">
                <Breadcrumbs />
            </div>
            <div className="space-y-1 print:hidden">
                <h2 className="text-3xl font-extrabold tracking-tight italic">Notice of Security Deposit Itemization</h2>
                <p className="text-sm text-slate-500">Fill in the details on the left — the official notice updates live on the right.</p>
            </div>
            <SecurityDepositItemization />
        </div>
    );
}
