'use client';

import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { supabase } from '@/lib/supabase';
import { Home, CheckCircle2, Building2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyListing {
    slug: string;
    name: string;
    available: boolean;
}

export default function ModifyPropertiesPage() {
    const [listings, setListings] = useState<PropertyListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingSlug, setSavingSlug] = useState<string | null>(null);

    useEffect(() => {
        supabase
            .from('property_listings')
            .select('slug, name, available')
            .order('name')
            .then(({ data, error }) => {
                if (error) {
                    // 42P01 = undefined_table (raw Postgres); PGRST205 is
                    // PostgREST's "table not in schema cache" equivalent.
                    setError(
                        error.code === '42P01' || error.code === 'PGRST205'
                            ? 'The property_listings table doesn\'t exist yet — run supabase_migration_property_listings.sql in the Supabase SQL editor first.'
                            : error.message
                    );
                } else {
                    setListings(data as PropertyListing[]);
                }
                setLoading(false);
            });
    }, []);

    const toggleAvailable = async (slug: string) => {
        const current = listings.find(l => l.slug === slug);
        if (!current) return;
        const nextAvailable = !current.available;

        setSavingSlug(slug);
        setListings(prev => prev.map(l => l.slug === slug ? { ...l, available: nextAvailable } : l));

        const { error } = await supabase
            .from('property_listings')
            .update({ available: nextAvailable, updated_at: new Date().toISOString() })
            .eq('slug', slug);

        if (error) {
            // Revert on failure.
            setListings(prev => prev.map(l => l.slug === slug ? { ...l, available: current.available } : l));
            alert(`Couldn't update "${current.name}": ${error.message}`);
        }
        setSavingSlug(null);
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 pb-20">
            <Breadcrumbs />
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2a9d8f]/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-[#2a9d8f]" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight italic">Modify Properties</h2>
                </div>
                <p className="text-sm text-slate-500 max-w-2xl">
                    Toggle whether each rental shows as Available or Unavailable on the &quot;Our Properties&quot;
                    cards across cvpproperties.com. Changes go live the next time a visitor loads the site.
                </p>
            </div>

            {loading ? (
                <p className="text-sm text-slate-400">Loading properties…</p>
            ) : error ? (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4 max-w-2xl">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-400">{error}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                    {listings.map(listing => (
                        <div
                            key={listing.slug}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex items-center justify-between gap-4"
                        >
                            <div>
                                <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug">{listing.name}</h3>
                                <p className="text-[11px] text-slate-400 mt-1">{listing.slug}.html</p>
                            </div>
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 flex-shrink-0">
                                <button
                                    onClick={() => { if (listing.available) toggleAvailable(listing.slug); }}
                                    disabled={savingSlug === listing.slug}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50',
                                        !listing.available ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    )}
                                >
                                    <Home className="h-3.5 w-3.5" /> Unavailable
                                </button>
                                <button
                                    onClick={() => { if (!listing.available) toggleAvailable(listing.slug); }}
                                    disabled={savingSlug === listing.slug}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50',
                                        listing.available ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    )}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Available
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
