import { AssetTable } from '@/components/AssetTable';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export default function AssetsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <Breadcrumbs />
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Depreciation Schedule</h2>
            </div>
            <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
                <AssetTable />
            </div>
            <div className="md:hidden">
                <AssetTable />
            </div>
        </div>
    );
}
