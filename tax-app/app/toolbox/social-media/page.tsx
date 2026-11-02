'use client';

import { useEffect, useRef, useState } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { supabase } from '@/lib/supabase';
import {
    Megaphone,
    AlertTriangle,
    UploadCloud,
    X,
    Clock,
    Sparkles,
    ThumbsUp,
    ThumbsDown,
    CheckCircle2,
    Instagram,
    Facebook,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialCampaign {
    id: string;
    title: string;
    context: string;
    image_urls: string[];
    status: 'new' | 'drafted' | 'approved' | 'published' | 'rejected';
    caption: string | null;
    reel_url: string | null;
    platforms: string[];
    notes: string | null;
    created_at: string;
}

const STATUS_META: Record<SocialCampaign['status'], { label: string; className: string }> = {
    new: { label: 'Waiting to be drafted', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
    drafted: { label: 'Ready for your review', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
    approved: { label: 'Approved — queued to post', className: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400' },
    published: { label: 'Published', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
    rejected: { label: 'Rejected', className: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' },
};

export default function SocialMediaPage() {
    const [campaigns, setCampaigns] = useState<SocialCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [context, setContext] = useState('');
    const [platforms, setPlatforms] = useState<string[]>(['instagram']);
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadCampaigns = () => {
        supabase
            .from('social_campaigns')
            .select('*')
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (error) {
                    if (error.code === '42P01' || error.code === 'PGRST205') {
                        setLoadError('The social_campaigns table doesn\'t exist yet — run supabase_migration_social_campaigns.sql in the Supabase SQL editor first.');
                    } else {
                        setLoadError(error.message);
                    }
                } else {
                    setCampaigns(data as SocialCampaign[]);
                    setLoadError(null);
                }
                setLoading(false);
            });
    };

    useEffect(() => { loadCampaigns(); }, []);

    const togglePlatform = (p: string) => {
        setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    };

    const addFiles = (incoming: FileList | null) => {
        if (!incoming) return;
        setFiles(prev => [...prev, ...Array.from(incoming)]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const submit = async () => {
        if (!title.trim() || !context.trim()) {
            setSubmitError('Give it a title and a short description of what the post is for.');
            return;
        }
        setSubmitting(true);
        setSubmitError(null);

        const id = crypto.randomUUID();
        const imageUrls: string[] = [];

        for (const file of files) {
            const path = `${id}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('social-media').upload(path, file);
            if (uploadError) {
                setSubmitError(`Couldn't upload ${file.name}: ${uploadError.message}`);
                setSubmitting(false);
                return;
            }
            const { data } = supabase.storage.from('social-media').getPublicUrl(path);
            imageUrls.push(data.publicUrl);
        }

        const { error } = await supabase.from('social_campaigns').insert([{
            id,
            title: title.trim(),
            context: context.trim(),
            image_urls: imageUrls,
            platforms,
            status: 'new',
        }]);

        if (error) {
            setSubmitError(error.message);
            setSubmitting(false);
            return;
        }

        setTitle('');
        setContext('');
        setFiles([]);
        setPlatforms(['instagram']);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSubmitting(false);
        loadCampaigns();
    };

    const setStatus = async (id: string, status: SocialCampaign['status']) => {
        setBusyId(id);
        const previous = campaigns;
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status } : c));

        const { error } = await supabase
            .from('social_campaigns')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            setCampaigns(previous);
            alert(`Couldn't update status: ${error.message}`);
        }
        setBusyId(null);
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 pb-20">
            <Breadcrumbs />
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2a9d8f]/10 flex items-center justify-center">
                        <Megaphone className="h-5 w-5 text-[#2a9d8f]" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight italic">Social Media & Marketing</h2>
                </div>
                <p className="text-sm text-slate-500 max-w-2xl">
                    Attach a photo (or a few) and describe what you&apos;re promoting — a retreat, a listing, an
                    update. It&apos;s queued here, a Reel and caption get drafted for it, and it lands back in this
                    list marked <span className="font-bold">&quot;Ready for your review&quot;</span>. Nothing posts
                    to Instagram, Facebook, or cvpproperties.com until you click <span className="font-bold">Approve</span>.
                </p>
            </div>

            {/* New campaign form */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 max-w-2xl space-y-4">
                <h3 className="font-black text-sm text-slate-900 dark:text-white">New post idea</h3>

                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Spring Retreat Teaser"
                        className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/40"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">What&apos;s this post about?</label>
                    <textarea
                        value={context}
                        onChange={e => setContext(e.target.value)}
                        rows={3}
                        placeholder="Draft context — dates, what makes it special, any CTA you want (e.g. link in bio to book)..."
                        className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/40 resize-none"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Platforms</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => togglePlatform('instagram')}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                                platforms.includes('instagram')
                                    ? 'bg-slate-900 dark:bg-[#2a9d8f] text-white border-transparent'
                                    : 'text-slate-500 border-slate-200 dark:border-slate-700'
                            )}
                        >
                            <Instagram className="h-3.5 w-3.5" /> Instagram
                        </button>
                        <button
                            type="button"
                            disabled
                            title="Coming later"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                        >
                            <Facebook className="h-3.5 w-3.5" /> Facebook
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Photos / video</label>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg py-4 hover:border-[#2a9d8f]/50 hover:text-[#2a9d8f] transition-colors"
                    >
                        <UploadCloud className="h-4 w-4" /> Attach photos or a video
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={e => addFiles(e.target.files)}
                        className="hidden"
                    />
                    {files.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {files.map((f, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-medium">
                                    <span className="max-w-[160px] truncate">{f.name}</span>
                                    <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-rose-500">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {submitError && (
                    <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl p-3">
                        <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-700 dark:text-rose-400">{submitError}</p>
                    </div>
                )}

                <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="w-full bg-slate-900 dark:bg-[#2a9d8f] text-white text-xs font-black uppercase tracking-widest rounded-lg py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {submitting ? 'Submitting…' : 'Queue for drafting'}
                </button>
            </div>

            {/* Campaign list */}
            <div className="space-y-3 max-w-2xl">
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Queue</h3>
                {loading ? (
                    <p className="text-sm text-slate-400">Loading…</p>
                ) : loadError ? (
                    <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 dark:text-amber-400">{loadError}</p>
                    </div>
                ) : campaigns.length === 0 ? (
                    <p className="text-sm text-slate-400">Nothing queued yet — submit a post idea above.</p>
                ) : (
                    campaigns.map(c => {
                        const meta = STATUS_META[c.status];
                        return (
                            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h4 className="font-black text-sm text-slate-900 dark:text-white">{c.title}</h4>
                                        <p className="text-xs text-slate-500 mt-1">{c.context}</p>
                                    </div>
                                    <span className={cn('text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1', meta.className)}>
                                        {c.status === 'new' && <Clock className="h-3 w-3" />}
                                        {c.status === 'drafted' && <Sparkles className="h-3 w-3" />}
                                        {c.status === 'published' && <CheckCircle2 className="h-3 w-3" />}
                                        {meta.label}
                                    </span>
                                </div>

                                {c.image_urls.length > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                        {c.image_urls.map(url => (
                                            <img key={url} src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                                        ))}
                                    </div>
                                )}

                                {c.status !== 'new' && c.caption && (
                                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Drafted caption</p>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{c.caption}</p>
                                        {c.reel_url && (
                                            <video src={c.reel_url} controls className="w-full max-w-[220px] rounded-lg" />
                                        )}
                                    </div>
                                )}

                                {c.status === 'drafted' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setStatus(c.id, 'approved')}
                                            disabled={busyId === c.id}
                                            className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
                                        >
                                            <ThumbsUp className="h-3.5 w-3.5" /> Approve
                                        </button>
                                        <button
                                            onClick={() => setStatus(c.id, 'rejected')}
                                            disabled={busyId === c.id}
                                            className="flex items-center gap-1.5 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
                                        >
                                            <ThumbsDown className="h-3.5 w-3.5" /> Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
