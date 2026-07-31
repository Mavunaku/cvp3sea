'use client';

import { useState } from 'react';
import { Printer, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface DeductionItem {
    id: string;
    description: string;
    detail: string;
    amount: number;
}

let idCounter = 0;
const newId = () => `ded-${Date.now()}-${idCounter++}`;

const starterDeductions: DeductionItem[] = [
    { id: newId(), description: 'Deep Cleaning & Trash Removal', detail: 'Removal of abandoned personal belongings, heavy kitchen appliance degreasing, bath sanitation, and rubbish disposal.', amount: 0 },
    { id: newId(), description: 'Drywall Damage Repair & Repainting', detail: 'Patching wall holes, gouges, and touch-up painting beyond reasonable wear and tear in living area/bedrooms.', amount: 0 },
    { id: newId(), description: 'Flooring & Carpet Replacement / Repair', detail: 'Professional steam cleaning / stain treatment or localized repair due to severe staining/damage.', amount: 0 },
];

const todayISO = () => new Date().toISOString().split('T')[0];

const formatDate = (iso: string) => {
    if (!iso) return '[Date]';
    const [y, m, d] = iso.split('-').map(Number);
    if (!y) return '[Date]';
    return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const fmtMoney = (n: number) =>
    `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function SecurityDepositItemization() {
    const [tenantName, setTenantName] = useState('');
    const [propertyStreet, setPropertyStreet] = useState('');
    const [propertyUnit, setPropertyUnit] = useState('');
    const [propertyCityStateZip, setPropertyCityStateZip] = useState('');
    const [forwardingAddress, setForwardingAddress] = useState('');
    const [dateOfNotice, setDateOfNotice] = useState(todayISO());
    const [leaseStart, setLeaseStart] = useState('');
    const [leaseEnd, setLeaseEnd] = useState('');
    const [landlordName, setLandlordName] = useState('CVP Properties 4.0 LLC');
    const [contactPhone, setContactPhone] = useState('(518) 405-9055');
    const [representativeName, setRepresentativeName] = useState('Valentian Paulsen');
    const [depositHeld, setDepositHeld] = useState<number>(0);
    const [deductions, setDeductions] = useState<DeductionItem[]>(starterDeductions);

    const totalDeductions = deductions.reduce((sum, d) => sum + (Number.isFinite(d.amount) ? d.amount : 0), 0);
    const netBalance = depositHeld - totalDeductions;
    const isRefundDue = netBalance > 0;
    const isZeroBalance = netBalance === 0;
    const isAmountOwed = netBalance < 0;

    const addDeduction = () => {
        setDeductions([...deductions, { id: newId(), description: '', detail: '', amount: 0 }]);
    };

    const updateDeduction = (id: string, patch: Partial<DeductionItem>) => {
        setDeductions(deductions.map(d => (d.id === id ? { ...d, ...patch } : d)));
    };

    const removeDeduction = (id: string) => {
        setDeductions(deductions.filter(d => d.id !== id));
    };

    const handlePrint = () => window.print();

    const propertyLine1 = [propertyStreet, propertyUnit].filter(Boolean).join(', ') || '[Property Street Address, Unit #]';
    const propertyLine2 = propertyCityStateZip || '[City, State, ZIP]';

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,420px)_1fr] gap-6 print:block">
            {/* ===================== FORM (hidden when printing) ===================== */}
            <div className="space-y-6 print:hidden">
                <Link href="/toolbox" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to Landlord Toolbox
                </Link>

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
                        <Field label="Tenant Forwarding Address" span2>
                            <input value={forwardingAddress} onChange={e => setForwardingAddress(e.target.value)} placeholder="Where the tenant can be reached after move-out" className="input" />
                        </Field>
                        <Field label="Date of Notice">
                            <input type="date" value={dateOfNotice} onChange={e => setDateOfNotice(e.target.value)} className="input" />
                        </Field>
                        <Field label="">
                            <div />
                        </Field>
                        <Field label="Lease Start Date">
                            <input type="date" value={leaseStart} onChange={e => setLeaseStart(e.target.value)} className="input" />
                        </Field>
                        <Field label="Move-Out Date">
                            <input type="date" value={leaseEnd} onChange={e => setLeaseEnd(e.target.value)} className="input" />
                        </Field>
                    </div>
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

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Deposit &amp; Deductions</h2>
                    <Field label="Initial Security Deposit Held ($)">
                        <input
                            type="number"
                            value={depositHeld || ''}
                            onChange={e => setDepositHeld(Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0)}
                            placeholder="1500"
                            className="input font-mono"
                        />
                    </Field>

                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {deductions.map((d, i) => (
                            <div key={d.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2 relative">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item {i + 1}</span>
                                    <button onClick={() => removeDeduction(d.id)} className="text-slate-400 hover:text-rose-600 transition-colors" title="Remove item">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <input
                                    value={d.description}
                                    onChange={e => updateDeduction(d.id, { description: e.target.value })}
                                    placeholder="Item / description of damage"
                                    className="input font-semibold"
                                />
                                <textarea
                                    value={d.detail}
                                    onChange={e => updateDeduction(d.id, { detail: e.target.value })}
                                    placeholder="Additional detail (optional)"
                                    rows={2}
                                    className="input resize-none text-xs"
                                />
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-400">$</span>
                                    <input
                                        type="number"
                                        value={d.amount || ''}
                                        onChange={e => updateDeduction(d.id, { amount: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0 })}
                                        placeholder="0.00"
                                        className="input font-mono"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addDeduction}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-500 hover:border-[#2a9d8f] hover:text-[#2a9d8f] transition-colors"
                    >
                        <Plus className="h-4 w-4" /> Add Deduction Item
                    </button>
                </div>

                <button
                    onClick={handlePrint}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-black transition-all shadow-lg active:scale-[0.99]"
                >
                    <Printer className="h-4 w-4" /> Print / Save as PDF
                </button>
            </div>

            {/* ===================== LIVE PREVIEW / PRINTABLE LETTER ===================== */}
            <div className="print:w-full">
                <div className="xl:sticky xl:top-6">
                    <div id="deposit-letter" className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-200 print:shadow-none print:border-none print:rounded-none mx-auto max-w-[850px]">
                        {/* Header */}
                        <div className="bg-slate-900 text-white px-10 py-8">
                            <h1 className="text-2xl font-black uppercase tracking-tight">Notice of Security Deposit Itemization</h1>
                            <p className="text-sm text-slate-300 mt-1">Statement of Account &amp; Deduction Breakdown</p>
                        </div>

                        <div className="px-10 py-8 space-y-7">
                            {/* Info grid */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
                                <InfoBlock label="To (Tenant Name)">{tenantName || '[Tenant Name]'}</InfoBlock>
                                <InfoBlock label="Date of Notice">{formatDate(dateOfNotice)}</InfoBlock>

                                <InfoBlock label="Rental Property Address">
                                    {propertyLine1}<br />{propertyLine2}
                                </InfoBlock>
                                <InfoBlock label="Lease Term">
                                    {leaseStart ? formatDate(leaseStart) : '[Start Date]'} to {leaseEnd ? formatDate(leaseEnd) : '[Move-out Date]'}
                                </InfoBlock>

                                <InfoBlock label="Forwarding Address">{forwardingAddress || '[Tenant Forwarding Address]'}</InfoBlock>
                                <InfoBlock label="Landlord / Management">
                                    {landlordName || '[Landlord / Property Manager Name]'}<br />{contactPhone}
                                </InfoBlock>
                            </div>

                            <hr className="border-slate-200" />

                            {/* Salutation */}
                            <div className="space-y-4 text-sm leading-relaxed text-slate-700">
                                <p>Dear <strong className="text-slate-900">{tenantName || '[Tenant Name]'}</strong>,</p>
                                <p>
                                    This letter serves as formal written notification regarding the disposition of your security
                                    deposit held for the rental property listed above. Following your vacate date, a comprehensive
                                    move-out inspection was conducted to evaluate the condition of the premises.
                                </p>
                                <p>
                                    In accordance with applicable state and local landlord-tenant law, your security deposit has
                                    been applied toward essential repairs, heavy cleaning, and damage remediation beyond ordinary
                                    wear and tear. Below is an itemized accounting of all incurred expenses, estimates, and total
                                    deductions.
                                </p>
                            </div>

                            {/* Itemized table */}
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-900 mb-3">
                                    <span className="w-1 h-4 bg-blue-600 rounded-full" /> Itemized Deduction Schedule
                                </h3>
                                <div className="rounded-lg border border-slate-200 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="w-10 px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">#</th>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Item &amp; Description of Damage / Work Required</th>
                                                <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">Estimated / Actual Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {deductions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-6 text-center text-slate-400 italic">No deductions itemized.</td>
                                                </tr>
                                            ) : (
                                                deductions.map((d, i) => (
                                                    <tr key={d.id}>
                                                        <td className="px-4 py-3 align-top text-slate-400 font-mono">{i + 1}</td>
                                                        <td className="px-4 py-3 align-top">
                                                            <div className="font-bold text-slate-900">{d.description || <span className="text-slate-400 font-normal italic">Untitled item</span>}</div>
                                                            {d.detail && <div className="text-xs text-slate-500 mt-0.5">{d.detail}</div>}
                                                        </td>
                                                        <td className="px-4 py-3 align-top text-right font-mono font-bold text-slate-900 whitespace-nowrap">{fmtMoney(d.amount)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Summary */}
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-900 mb-3">
                                    <span className="w-1 h-4 bg-blue-600 rounded-full" /> Deposit Accounting Summary
                                </h3>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-2.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-semibold text-slate-700">Initial Security Deposit Held:</span>
                                        <span className="font-mono font-bold text-slate-900">{fmtMoney(depositHeld)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-semibold text-slate-700">Less Total Itemized Deductions:</span>
                                        <span className="font-mono font-bold text-rose-600">- {fmtMoney(totalDeductions)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2.5 border-t-2 border-slate-300">
                                        <span className="font-black text-slate-900">
                                            {isAmountOwed ? 'Net Balance (Amount Owed):' : 'Net Balance Refundable:'}
                                        </span>
                                        <span className={`font-mono font-black text-lg ${isAmountOwed ? 'text-rose-600' : 'text-emerald-700'}`}>
                                            {isAmountOwed ? `(${fmtMoney(netBalance)})` : fmtMoney(netBalance)}
                                        </span>
                                    </div>
                                </div>

                                {isZeroBalance && (
                                    <NoticeBox tone="rose" title="Notice of Zero Balance">
                                        Because the total cost of necessary repairs and cleaning equals the initial security deposit,
                                        <strong> no refund is due</strong>. Copies of estimates, contractor receipts, and photographic
                                        evidence detailing the pre-existing and post-lease conditions are attached to this statement or
                                        available upon request.
                                    </NoticeBox>
                                )}
                                {isAmountOwed && (
                                    <NoticeBox tone="rose" title="Notice of Outstanding Amount Owed">
                                        Because the total cost of necessary repairs and cleaning <strong>exceeds</strong> the initial
                                        security deposit, an additional balance of <strong>{fmtMoney(netBalance)}</strong> remains due.
                                        Copies of estimates, contractor receipts, and photographic evidence detailing the pre-existing
                                        and post-lease conditions are attached to this statement or available upon request. Please
                                        remit payment or contact management to arrange payment within 14 days of receiving this notice.
                                    </NoticeBox>
                                )}
                                {isRefundDue && (
                                    <NoticeBox tone="emerald" title="Refund Notice">
                                        A refund of <strong>{fmtMoney(netBalance)}</strong> is due and will be issued to the forwarding
                                        address listed above within the timeframe required by applicable law. Copies of estimates,
                                        contractor receipts, and photographic evidence supporting the itemized deductions above are
                                        attached to this statement or available upon request.
                                    </NoticeBox>
                                )}
                            </div>

                            <p className="text-sm text-slate-700 leading-relaxed">
                                If you have any questions regarding these items or wish to review the repair receipts and inspection
                                photos, please contact management within 14 days of receiving this notice.
                            </p>

                            {/* Signature */}
                            <div className="pt-4 space-y-1 text-sm">
                                <p className="text-slate-700 mb-10">Sincerely,</p>
                                <div className="w-64 border-b border-slate-400" />
                                <p className="font-black text-slate-900 pt-1">{representativeName || '[Authorized Representative]'}</p>
                                <p className="text-slate-500 text-xs">Property Manager / Authorized Representative</p>
                                <p className="text-slate-500 text-xs">{landlordName || '[Landlord / Property Manager Name]'}</p>
                            </div>

                            <hr className="border-slate-200" />
                            <p className="text-[10px] text-slate-400 text-center">
                                This document constitutes formal notice of security deposit disposition pursuant to applicable
                                landlord-tenant law. This tool provides a planning template only and does not constitute legal
                                advice — confirm requirements under your state and local law before sending.
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
