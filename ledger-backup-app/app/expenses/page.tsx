import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LedgerTable } from '@/components/LedgerTable';
import { SummaryCard } from '@/components/SummaryCard';

export default function ExpensesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <Breadcrumbs />
            <div className="flex items-center justify-between space-y-2">
            </div>
            <LedgerTable type="expense" />
            <div className="mt-8">
                <SummaryCard />
            </div>
        </div>
    );
}
