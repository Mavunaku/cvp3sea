'use client';

import { useEffect, useRef, useState } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { supabase } from '@/lib/supabase';
import { Home, CheckCircle2, Building2, AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyListing {
    slug: string;
    name: string;
    available: boolean;
    heading: string | null;
    description: string | null;
}

export default function ModifyPropertiesPage() {
    const [listings, setListings] = useState<PropertyListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingSlug, setSavingSlug] = useState<string | null>(null);
    const [savedSlug, setSavedSlug] = useState<string | null>(null);

    // Tracks the last value actually persisted to Supabase per slug/field,
    // separate from `listings` state (which updates on every keystroke via
    // editField). Comparing against `listings` in saveField would always see
    // "no change" by the time onBlur fires, since editField already wrote
    // the new value into it — this ref is the real source of truth for
    // "did this actually change since the last save".
    const lastSavedRef = useRef<Record<string, { heading: string; description: string }>>({});

    useEffect(() => {
        supabase
            .from('property_listings')
            .select('slug, name, available, heading, description')
            .order('name')
            .then(({ data, error }) => {
                if (error) {
                    // 42P01 = undefined_table (raw Postgres); PGRST205 is
                    // PostgREST's "table not in schema cache" equivalent.
                    // 42703/PGRST204 means heading/description haven't been
                    // migrated onto this table yet.
                    if (error.code === '42P01' || error.code === 'PGRST205') {
                        setError('The property_listings table doesn\'t exist yet — run supabase_migration_property_listings.sql in the Supabase SQL editor first.');
                    } else if (error.code === '42703' || error.code === 'PGRST204') {
                        setError('Run supabase_migration_property_listing_fields.sql in the Supabase SQL editor to add the heading/description fields.');
                    } else {
                        setError(error.message);
                    }
                } else {
                    const rows = data as PropertyListing[];
                    rows.forEach(l => {
                        lastSavedRef.current[l.slug] = { heading: l.heading ?? '', description: l.description ?? '' };
                    });
                    setListings(rows);
                }
                setLoading(false);
            });
    }, []);

    const flashSaved = (slug: string) => {
        setSavedSlug(slug);
        setTimeout(() => setSavedSlug(prev => prev === slug ? null : prev), 1500);
    };

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
        } else {
            flashSaved(slug);
        }
        setSavingSlug(null);
    };

    const editField = (slug: string, field: 'heading' | 'description', value: string) => {
        setListings(prev => prev.map(l => l.slug === slug ? { ...l, [field]: value } : l));
    };

    const saveField = async (slug: string, field: 'heading' | 'description', value: string) => {
        const previous = lastSavedRef.current[slug]?.[field] ?? '';
        if (value === previous) return; // unchanged, nothing to save

        setSavingSlug(slug);
        const { error } = await supabase
            .from('property_listings')
            .update({ [field]: value, updated_at: new Date().toISOString() })
            .eq('slug', slug);

        if (error) {
            setListings(prev => prev.map(l => l.slug === slug ? { ...l, [field]: previous } : l));
            alert(`Couldn't save ${field}: ${error.message}`);
        } else {
            lastSavedRef.current[slug] = { ...lastSavedRef.current[slug], [field]: value };
            flashSaved(slug);
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
                    Edit each rental&apos;s Available/Unavailable status, card heading, and description shown on
                    the &quot;Our Properties&quot; cards across cvpproperties.com. Text fields save when you click
                    away. Changes go live the next time a visitor loads the site.
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
                    {listings.map(listing => (
                        <div
                            key={listing.slug}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug">{listing.name}</h3>
                                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                                        {listing.slug}.html
                                        {savedSlug === listing.slug && (
                                            <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                                                <Check className="h-3 w-3" /> Saved
                                            </span>
                                        )}
                                    </p>
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

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Card Heading</label>
                                <input
                                    type="text"
                                    value={listing.heading ?? ''}
                                    onChange={e => editField(listing.slug, 'heading', e.target.value)}
                                    onBlur={e => saveField(listing.slug, 'heading', e.target.value)}
                                    className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/40"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Card Description</label>
                                <textarea
                                    value={listing.description ?? ''}
                                    onChange={e => editField(listing.slug, 'description', e.target.value)}
                                    onBlur={e => saveField(listing.slug, 'description', e.target.value)}
                                    rows={2}
                                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/40 resize-none"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
