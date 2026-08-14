'use client';

import { useEffect, useState } from 'react';
import { Printer, ArrowLeft, Save, RotateCcw, Check } from 'lucide-react';
import Link from 'next/link';
import { loadDraft, saveDraft, clearDraft } from '@/lib/draftStorage';

const DRAFT_KEY = 'toolbox-draft-lease-renewal';

const todayISO = () => new Date().toISOString().split('T')[0];

const formatDate = (iso: string) => {
    if (!iso) return '[Date]';
    const [y, m, d] = iso.split('-').map(Number);
    if (!y) return '[Date]';
    return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const fmtMoney = (n: number) =>
    `$${Math.abs(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface LeaseRenewalDraft {
    tenantName: string; propertyStreet: string; propertyUnit: string; propertyCityStateZip: string;
    dateOfNotice: string; currentTermEnd: string; newTermStart: string; newTermEnd: string;
    currentRent: number; newRent: number; responseDeadline: string; additionalTerms: string;
    landlordName: string; contactPhone: string; representativeName: string;
}

export function LeaseRenewalNotice() {
    // Plain SSR-safe defaults — this component is server-rendered, and the
    // server has no localStorage, so the initial state (both server and the
    // client's first hydration pass) must match. The saved draft, if any,
    // is applied client-side afterward via the hydration effect below.
    const [tenantName, setTenantName] = useState('');
    const [propertyStreet, setPropertyStreet] = useState('');
    const [propertyUnit, setPropertyUnit] = useState('');
    const [propertyCityStateZip, setPropertyCityStateZip] = useState('');
    const [dateOfNotice, setDateOfNotice] = useState(todayISO());
    const [currentTermEnd, setCurrentTermEnd] = useState('');
    const [newTermStart, setNewTermStart] = useState('');
    const [newTermEnd, setNewTermEnd] = useState('');
    const [currentRent, setCurrentRent] = useState<number>(0);
    const [newRent, setNewRent] = useState<number>(0);
    const [responseDeadline, setResponseDeadline] = useState('');
    const [additionalTerms, setAdditionalTerms] = useState('');
    const [landlordName, setLandlordName] = useState('CVP Properties 4.0 LLC');
    const [contactPhone, setContactPhone] = useState('(518) 405-9055');
    const [representativeName, setRepresentativeName] = useState('Valentian Paulsen');
    const [savedFlash, setSavedFlash] = useState(false);

    // Hydrated is REACT STATE, not a ref — see SecurityDepositItemization
    // for why: setting it inside the same effect that calls all the setters
    // means React batches everything into one render, so the auto-save
    // effect never observes a stale mid-hydration snapshot.
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => {
        const draft = loadDraft<LeaseRenewalDraft>(DRAFT_KEY);
        if (draft) {
            if (draft.tenantName !== undefined) setTenantName(draft.tenantName);
            if (draft.propertyStreet !== undefined) setPropertyStreet(draft.propertyStreet);
            if (draft.propertyUnit !== undefined) setPropertyUnit(draft.propertyUnit);
            if (draft.propertyCityStateZip !== undefined) setPropertyCityStateZip(draft.propertyCityStateZip);
            if (draft.dateOfNotice !== undefined) setDateOfNotice(draft.dateOfNotice);
            if (draft.currentTermEnd !== undefined) setCurrentTermEnd(draft.currentTermEnd);
            if (draft.newTermStart !== undefined) setNewTermStart(draft.newTermStart);
            if (draft.newTermEnd !== undefined) setNewTermEnd(draft.newTermEnd);
            if (draft.currentRent !== undefined) setCurrentRent(draft.currentRent);
            if (draft.newRent !== undefined) setNewRent(draft.newRent);
            if (draft.responseDeadline !== undefined) setResponseDeadline(draft.responseDeadline);
            if (draft.additionalTerms !== undefined) setAdditionalTerms(draft.additionalTerms);
            if (draft.landlordName !== undefined) setLandlordName(draft.landlordName);
            if (draft.contactPhone !== undefined) setContactPhone(draft.contactPhone);
            if (draft.representativeName !== undefined) setRepresentativeName(draft.representativeName);
        }
        setHydrated(true);
    }, []);

    const currentDraft = () => ({
        tenantName, propertyStreet, propertyUnit, propertyCityStateZip, dateOfNotice,
        currentTermEnd, newTermStart, newTermEnd, currentRent, newRent, responseDeadline,
        additionalTerms, landlordName, contactPhone, representativeName,
    });

    useEffect(() => {
        if (!hydrated) return;
        saveDraft(DRAFT_KEY, currentDraft());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hydrated, tenantName, propertyStreet, propertyUnit, propertyCityStateZip, dateOfNotice,
        currentTermEnd, newTermStart, newTermEnd, currentRent, newRent, responseDeadline,
        additionalTerms, landlordName, contactPhone, representativeName]);

    const handleSave = () => {
        saveDraft(DRAFT_KEY, currentDraft());
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
    };

    const handleClear = () => {
        if (!window.confirm('Clear this form and start over? This cannot be undone.')) return;
        clearDraft(DRAFT_KEY);
        setTenantName('');
        setPropertyStreet('');
        setPropertyUnit('');
        setPropertyCityStateZip('');
        setDateOfNotice(todayISO());
        setCurrentTermEnd('');
        setNewTermStart('');
        setNewTermEnd('');
        setCurrentRent(0);
        setNewRent(0);
        setResponseDeadline('');
        setAdditionalTerms('');
        setLandlordName('CVP Properties 4.0 LLC');
        setContactPhone('(518) 405-9055');
        setRepresentativeName('Valentian Paulsen');
    };

    const rentDelta = (newRent || 0) - (currentRent || 0);
    const pctChange = currentRent ? (rentDelta / currentRent) * 100 : 0;
    const isIncrease = rentDelta > 0;
    const isDecrease = rentDelta < 0;
    const isFlat = rentDelta === 0;
    const isBigIncrease = isIncrease && pctChange >= 5;

    const handlePrint = () => window.print();

    const propertyLine1 = [propertyStreet, propertyUnit].filter(Boolean).join(', ') || '[Property Street Address, Unit #]';
    const propertyLine2 = propertyCityStateZip || '[City, State, ZIP]';

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,420px)_1fr] gap-6 print:block">
            {/* ===================== FORM ===================== */}
            <div className="space-y-6 print:hidden">
                <div className="flex items-center justify-between gap-3">
                    <Link href="/toolbox" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to Landlord Toolbox
                    </Link>
                    <div className="flex items-center gap-2">
                        {savedFlash && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                                <Check className="h-3.5 w-3.5" /> Saved
                            </span>
                        )}
                        <button
                            onClick={handleSave}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#2a9d8f]/10 text-[#2a9d8f] hover:bg-[#2a9d8f]/20 transition-colors"
                        >
                            <Save className="h-3.5 w-3.5" /> Save
                        </button>
                        <button
                            onClick={handleClear}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                            <RotateCcw className="h-3.5 w-3.5" /> Clear
                        </button>
                    </div>
                </div>
                <p className="text-[11px] text-slate-400 -mt-3">Your entries save automatically and will be here next time you open this tool.</p>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Notice Details</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Tenant Name" span2>
                            <input value={tenantName} onChange={e => setTenantName(e.target.value)} placeholder="Jane Doe" className="input" />
                        </Field>
                        <Field label="Property Street Address">
                            <input value={propertyStreet} onChange={e => setPropertyStreet(e.target.value)} placeholder="123 Main St" className="input" />
                        </Field>
                        <Field label="Unit / Apt #">
                            <input value={propertyUnit} onChange={e => setPropertyUnit(e.target.value)} placeholder="Apt 2" className="input" />
                        </Field>
                        <Field label="City, State, ZIP" span2>
                            <input value={propertyCityStateZip} onChange={e => setPropertyCityStateZip(e.target.value)} placeholder="Binghamton, NY 13905" className="input" />
                        </Field>
                        <Field label="Date of Notice">
                            <input type="date" value={dateOfNotice} onChange={e => setDateOfNotice(e.target.value)} className="input" />
                        </Field>
                        <Field label="Response Deadline">
                            <input type="date" value={responseDeadline} onChange={e => setResponseDeadline(e.target.value)} className="input" />
                        </Field>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Lease Term</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Current Term Ends" span2>
                            <input type="date" value={currentTermEnd} onChange={e => setCurrentTermEnd(e.target.value)} className="input" />
                        </Field>
                        <Field label="New Term Starts">
                            <input type="date" value={newTermStart} onChange={e => setNewTermStart(e.target.value)} className="input" />
                        </Field>
                        <Field label="New Term Ends">
                            <input type="date" value={newTermEnd} onChange={e => setNewTermEnd(e.target.value)} className="input" />
                        </Field>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Rent</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Current Monthly Rent ($)">
                            <input
                                type="number"
                                value={currentRent || ''}
                                onChange={e => setCurrentRent(Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0)}
                                placeholder="1500"
                                className="input font-mono"
                            />
                        </Field>
                        <Field label="New Monthly Rent ($)">
                            <input
                                type="number"
                                value={newRent || ''}
                                onChange={e => setNewRent(Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0)}
                                placeholder="1500"
                                className="input font-mono"
                            />
                        </Field>
                    </div>
                    {isBigIncrease && (
                        <p className="text-xs text-amber-600 font-semibold leading-relaxed">
                            This is a {pctChange.toFixed(1)}% increase. Under New York&apos;s Housing Stability and Tenant Protection Act,
                            rent increases of 5% or more generally require 30/60/90 days advance written notice depending on how long the
                            tenant has occupied the unit — confirm the exact requirement for this tenancy before sending.
                        </p>
                    )}
                    <Field label="Additional Terms / Notes (optional)">
                        <textarea
                            value={additionalTerms}
                            onChange={e => setAdditionalTerms(e.target.value)}
                            placeholder="Any other changes to the renewed lease..."
                            rows={3}
                            className="input resize-none text-xs"
                        />
                    </Field>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Landlord / Management</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Landlord / Property Manager Name" span2>
                            <input value={landlordName} onChange={e => setLandlordName(e.target.value)} className="input" />
                        </Field>
                        <Field label="Contact Phone">
                            <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="input" />
                        </Field>
                        <Field label="Signed By (Authorized Rep.)">
                            <input value={representativeName} onChange={e => setRepresentativeName(e.target.value)} className="input" />
                        </Field>
                    </div>
                </div>

                <button
                    onClick={handlePrint}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-black transition-all shadow-lg active:scale-[0.99]"
                >
                    <Printer className="h-4 w-4" /> Print / Save as PDF
                </button>
            </div>

            {/* ===================== LIVE PREVIEW ===================== */}
            <div className="print:w-full">
                <div className="xl:sticky xl:top-6">
                    <div className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-200 print:shadow-none print:border-none print:rounded-none mx-auto max-w-[850px]">
                        <div className="bg-slate-900 text-white px-10 py-8">
                            <h1 className="text-2xl font-black uppercase tracking-tight">Notice of Lease Renewal</h1>
                            <p className="text-sm text-slate-300 mt-1">Renewal Offer &amp; Rent Adjustment</p>
                        </div>

                        <div className="px-10 py-8 space-y-7">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
                                <InfoBlock label="To (Tenant Name)">{tenantName || '[Tenant Name]'}</InfoBlock>
                                <InfoBlock label="Date of Notice">{formatDate(dateOfNotice)}</InfoBlock>
                                <InfoBlock label="Rental Property Address">
                                    {propertyLine1}<br />{propertyLine2}
                                </InfoBlock>
                                <InfoBlock label="Current Term Ends">{formatDate(currentTermEnd)}</InfoBlock>
                                <InfoBlock label="Proposed New Term">
                                    {newTermStart ? formatDate(newTermStart) : '[Start Date]'} to {newTermEnd ? formatDate(newTermEnd) : '[End Date]'}
                                </InfoBlock>
                                <InfoBlock label="Landlord / Management">
                                    {landlordName || '[Landlord / Property Manager Name]'}<br />{contactPhone}
                                </InfoBlock>
                            </div>

                            <hr className="border-slate-200" />

                            <div className="space-y-4 text-sm leading-relaxed text-slate-700">
                                <p>Dear <strong className="text-slate-900">{tenantName || '[Tenant Name]'}</strong>,</p>
                                <p>
                                    Your current lease for the property listed above is set to expire on{' '}
                                    <strong>{formatDate(currentTermEnd)}</strong>. We would like to offer you the opportunity to renew
                                    your tenancy for a new term of {newTermStart ? formatDate(newTermStart) : '[Start Date]'} through{' '}
                                    {newTermEnd ? formatDate(newTermEnd) : '[End Date]'}, under the terms outlined below.
                                </p>
                            </div>

                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-900 mb-3">
                                    <span className="w-1 h-4 bg-blue-600 rounded-full" /> Rent Adjustment
                                </h3>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-2.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-semibold text-slate-700">Current Monthly Rent:</span>
                                        <span className="font-mono font-bold text-slate-900">{fmtMoney(currentRent)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-semibold text-slate-700">New Monthly Rent:</span>
                                        <span className="font-mono font-bold text-slate-900">{fmtMoney(newRent)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2.5 border-t-2 border-slate-300">
                                        <span className="font-black text-slate-900">
                                            {isFlat ? 'Change:' : isIncrease ? 'Increase:' : 'Decrease:'}
                                        </span>
                                        <span className={`font-mono font-black text-lg ${isIncrease ? 'text-rose-600' : isDecrease ? 'text-emerald-700' : 'text-slate-500'}`}>
                                            {isFlat ? 'No Change' : `${isIncrease ? '+' : '-'}${fmtMoney(rentDelta)} (${Math.abs(pctChange).toFixed(1)}%)`}
                                        </span>
                                    </div>
                                </div>

                                {isFlat && (
                                    <NoticeBox tone="emerald" title="No Rent Change">
                                        Your monthly rent will remain <strong>{fmtMoney(currentRent)}</strong> for the renewed term. All
                                        other lease terms remain unchanged unless otherwise noted below.
                                    </NoticeBox>
                                )}
                                {isIncrease && (
                                    <NoticeBox tone="rose" title="Rent Increase Notice">
                                        Effective {newTermStart ? formatDate(newTermStart) : '[Start Date]'}, your monthly rent will
                                        increase from <strong>{fmtMoney(currentRent)}</strong> to <strong>{fmtMoney(newRent)}</strong>{' '}
                                        ({pctChange.toFixed(1)}% increase). This notice is being provided in advance of your lease
                                        expiration in accordance with applicable landlord-tenant law.
                                    </NoticeBox>
                                )}
                                {isDecrease && (
                                    <NoticeBox tone="emerald" title="Rent Reduction">
                                        Effective {newTermStart ? formatDate(newTermStart) : '[Start Date]'}, your monthly rent will
                                        decrease from <strong>{fmtMoney(currentRent)}</strong> to <strong>{fmtMoney(newRent)}</strong>.
                                    </NoticeBox>
                                )}
                            </div>

                            {additionalTerms && (
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-900 mb-2">
                                        <span className="w-1 h-4 bg-blue-600 rounded-full" /> Additional Terms
                                    </h3>
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{additionalTerms}</p>
                                </div>
                            )}

                            <p className="text-sm text-slate-700 leading-relaxed">
                                Please confirm your intent to renew by signing below and returning this notice
                                {responseDeadline ? <> no later than <strong>{formatDate(responseDeadline)}</strong></> : ''}. If we do
                                not hear from you by that date, we will assume you do not wish to renew and will proceed according to
                                the terms of your current lease regarding move-out.
                            </p>

                            <div className="grid grid-cols-2 gap-8 pt-4 text-sm">
                                <div className="space-y-1">
                                    <p className="text-slate-700 mb-10">Sincerely,</p>
                                    <div className="w-full border-b border-slate-400" />
                                    <p className="font-black text-slate-900 pt-1">{representativeName || '[Authorized Representative]'}</p>
                                    <p className="text-slate-500 text-xs">Property Manager / Authorized Representative</p>
                                    <p className="text-slate-500 text-xs">{landlordName || '[Landlord / Property Manager Name]'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-700 mb-10">Tenant Acceptance:</p>
                                    <div className="w-full border-b border-slate-400" />
                                    <p className="font-black text-slate-900 pt-1">{tenantName || '[Tenant Name]'}</p>
                                    <p className="text-slate-500 text-xs">Signature &amp; Date</p>
                                </div>
                            </div>

                            <hr className="border-slate-200" />
                            <p className="text-[10px] text-slate-400 text-center">
                                This document constitutes formal notice of lease renewal terms pursuant to applicable landlord-tenant
                                law. This tool provides a planning template only and does not constitute legal advice — confirm notice
                                period requirements under your state and local law before sending.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .input {
                    width: 100%;
                    padding: 8px 12px;
                    font-size: 13px;
                    border: 1px solid rgb(226 232 240);
                    border-radius: 10px;
                    background: white;
                    color: rgb(15 23 42);
                }
                .dark .input {
                    background: rgb(15 23 42);
                    border-color: rgb(51 65 85);
                    color: rgb(241 245 249);
                }
                .input:focus {
                    outline: none;
                    border-color: #2a9d8f;
                    box-shadow: 0 0 0 3px rgba(42, 157, 143, 0.15);
                }
                @media print {
                    @page {
                        size: portrait;
                        margin: 1cm;
                    }
                    body {
                        background: white !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

function Field({ label, span2, children }: { label: string; span2?: boolean; children: React.ReactNode }) {
    return (
        <label className={`block space-y-1 ${span2 ? 'col-span-2' : ''}`}>
            {label && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>}
            {children}
        </label>
    );
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-blue-700">{label}</div>
            <div className="text-slate-900 mt-0.5">{children}</div>
        </div>
    );
}

function NoticeBox({ tone, title, children }: { tone: 'rose' | 'emerald'; title: string; children: React.ReactNode }) {
    const styles = tone === 'rose'
        ? 'bg-rose-50 border-rose-500 text-rose-900'
        : 'bg-emerald-50 border-emerald-500 text-emerald-900';
    return (
        <div className={`mt-3 rounded-lg border-l-4 p-4 text-sm leading-relaxed ${styles}`}>
            <p className="font-black mb-1">{title}:</p>
            {children}
        </div>
    );
}
