'use client';

import { useEffect, useState, Fragment } from 'react';
import { Printer, ArrowLeft, Save, RotateCcw, Check } from 'lucide-react';
import Link from 'next/link';
import { loadDraft, saveDraft, clearDraft } from '@/lib/draftStorage';

const DRAFT_KEY = 'toolbox-draft-lease-agreement';

const todayISO = () => new Date().toISOString().split('T')[0];

const formatDate = (iso: string) => {
    if (!iso) return '[Date]';
    const [y, m, d] = iso.split('-').map(Number);
    if (!y) return '[Date]';
    return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const fmtMoney = (n: number) =>
    `$${Math.abs(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ordinal = (n: number) => {
    if (!n) return '';
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

interface Clause {
    title: string;
    body: React.ReactNode;
}

interface LeaseAgreementDraft {
    tenantNames: string; propertyStreet: string; unitLabel: string; propertyCityStateZip: string;
    bedrooms: number; bathrooms: number; parkingDescription: string; garageAvailable: boolean; garageFee: number;
    dateOfAgreement: string; termLength: string; termStart: string;
    monthlyRent: number; rentDueDay: number; bouncedCheckFee: number; guarantorRequired: boolean;
    lateDeemedAfterDays: number; lateGraceDays: number; lateFeePerDay: number; lateFeeMax: number;
    utilitiesByLandlord: string; electricFixedFee: number; otherTenantUtilities: string;
    securityDeposit: number; petsAllowed: boolean; rentersInsuranceRequired: boolean; additionalTerms: string;
    landlordName: string; contactPhone: string; representativeName: string;
}

export function ResidentialLeaseAgreement() {
    // Plain SSR-safe defaults — this component is server-rendered, and the
    // server has no localStorage, so the initial state (both server and the
    // client's first hydration pass) must match. The saved draft, if any,
    // is applied client-side afterward via the hydration effect below.
    const [tenantNames, setTenantNames] = useState('');
    const [propertyStreet, setPropertyStreet] = useState('');
    const [unitLabel, setUnitLabel] = useState('');
    const [propertyCityStateZip, setPropertyCityStateZip] = useState('');
    const [bedrooms, setBedrooms] = useState<number>(3);
    const [bathrooms, setBathrooms] = useState<number>(2);
    const [parkingDescription, setParkingDescription] = useState('');
    const [garageAvailable, setGarageAvailable] = useState(false);
    const [garageFee, setGarageFee] = useState<number>(200);

    const [dateOfAgreement, setDateOfAgreement] = useState(todayISO());
    const [termLength, setTermLength] = useState('1 (one) Year');
    const [termStart, setTermStart] = useState('');

    const [monthlyRent, setMonthlyRent] = useState<number>(0);
    const [rentDueDay, setRentDueDay] = useState<number>(1);
    const [bouncedCheckFee, setBouncedCheckFee] = useState<number>(45);
    const [guarantorRequired, setGuarantorRequired] = useState(false);
    const [lateDeemedAfterDays, setLateDeemedAfterDays] = useState<number>(7);
    const [lateGraceDays, setLateGraceDays] = useState<number>(3);
    const [lateFeePerDay, setLateFeePerDay] = useState<number>(15);
    const [lateFeeMax, setLateFeeMax] = useState<number>(45);

    const [utilitiesByLandlord, setUtilitiesByLandlord] = useState('Gas, Water, Sewage, Heat, Garbage, Snow Removal & Lawn Care');
    const [electricFixedFee, setElectricFixedFee] = useState<number>(50);
    const [otherTenantUtilities, setOtherTenantUtilities] = useState('Cable, Internet');

    const [securityDeposit, setSecurityDeposit] = useState<number>(0);
    const [petsAllowed, setPetsAllowed] = useState(false);
    const [rentersInsuranceRequired, setRentersInsuranceRequired] = useState(true);
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
        const draft = loadDraft<LeaseAgreementDraft>(DRAFT_KEY);
        if (draft) {
            if (draft.tenantNames !== undefined) setTenantNames(draft.tenantNames);
            if (draft.propertyStreet !== undefined) setPropertyStreet(draft.propertyStreet);
            if (draft.unitLabel !== undefined) setUnitLabel(draft.unitLabel);
            if (draft.propertyCityStateZip !== undefined) setPropertyCityStateZip(draft.propertyCityStateZip);
            if (draft.bedrooms !== undefined) setBedrooms(draft.bedrooms);
            if (draft.bathrooms !== undefined) setBathrooms(draft.bathrooms);
            if (draft.parkingDescription !== undefined) setParkingDescription(draft.parkingDescription);
            if (draft.garageAvailable !== undefined) setGarageAvailable(draft.garageAvailable);
            if (draft.garageFee !== undefined) setGarageFee(draft.garageFee);
            if (draft.dateOfAgreement !== undefined) setDateOfAgreement(draft.dateOfAgreement);
            if (draft.termLength !== undefined) setTermLength(draft.termLength);
            if (draft.termStart !== undefined) setTermStart(draft.termStart);
            if (draft.monthlyRent !== undefined) setMonthlyRent(draft.monthlyRent);
            if (draft.rentDueDay !== undefined) setRentDueDay(draft.rentDueDay);
            if (draft.bouncedCheckFee !== undefined) setBouncedCheckFee(draft.bouncedCheckFee);
            if (draft.guarantorRequired !== undefined) setGuarantorRequired(draft.guarantorRequired);
            if (draft.lateDeemedAfterDays !== undefined) setLateDeemedAfterDays(draft.lateDeemedAfterDays);
            if (draft.lateGraceDays !== undefined) setLateGraceDays(draft.lateGraceDays);
            if (draft.lateFeePerDay !== undefined) setLateFeePerDay(draft.lateFeePerDay);
            if (draft.lateFeeMax !== undefined) setLateFeeMax(draft.lateFeeMax);
            if (draft.utilitiesByLandlord !== undefined) setUtilitiesByLandlord(draft.utilitiesByLandlord);
            if (draft.electricFixedFee !== undefined) setElectricFixedFee(draft.electricFixedFee);
            if (draft.otherTenantUtilities !== undefined) setOtherTenantUtilities(draft.otherTenantUtilities);
            if (draft.securityDeposit !== undefined) setSecurityDeposit(draft.securityDeposit);
            if (draft.petsAllowed !== undefined) setPetsAllowed(draft.petsAllowed);
            if (draft.rentersInsuranceRequired !== undefined) setRentersInsuranceRequired(draft.rentersInsuranceRequired);
            if (draft.additionalTerms !== undefined) setAdditionalTerms(draft.additionalTerms);
            if (draft.landlordName !== undefined) setLandlordName(draft.landlordName);
            if (draft.contactPhone !== undefined) setContactPhone(draft.contactPhone);
            if (draft.representativeName !== undefined) setRepresentativeName(draft.representativeName);
        }
        setHydrated(true);
    }, []);

    const currentDraft = () => ({
        tenantNames, propertyStreet, unitLabel, propertyCityStateZip, bedrooms, bathrooms,
        parkingDescription, garageAvailable, garageFee, dateOfAgreement, termLength, termStart,
        monthlyRent, rentDueDay, bouncedCheckFee, guarantorRequired, lateDeemedAfterDays,
        lateGraceDays, lateFeePerDay, lateFeeMax, utilitiesByLandlord, electricFixedFee,
        otherTenantUtilities, securityDeposit, petsAllowed, rentersInsuranceRequired,
        additionalTerms, landlordName, contactPhone, representativeName,
    });

    useEffect(() => {
        if (!hydrated) return;
        saveDraft(DRAFT_KEY, currentDraft());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hydrated, tenantNames, propertyStreet, unitLabel, propertyCityStateZip, bedrooms, bathrooms,
        parkingDescription, garageAvailable, garageFee, dateOfAgreement, termLength, termStart,
        monthlyRent, rentDueDay, bouncedCheckFee, guarantorRequired, lateDeemedAfterDays,
        lateGraceDays, lateFeePerDay, lateFeeMax, utilitiesByLandlord, electricFixedFee,
        otherTenantUtilities, securityDeposit, petsAllowed, rentersInsuranceRequired,
        additionalTerms, landlordName, contactPhone, representativeName]);

    const handleSave = () => {
        saveDraft(DRAFT_KEY, currentDraft());
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
    };

    const handleClear = () => {
        if (!window.confirm('Clear this form and start over? This cannot be undone.')) return;
        clearDraft(DRAFT_KEY);
        setTenantNames('');
        setPropertyStreet('');
        setUnitLabel('');
        setPropertyCityStateZip('');
        setBedrooms(3);
        setBathrooms(2);
        setParkingDescription('');
        setGarageAvailable(false);
        setGarageFee(200);
        setDateOfAgreement(todayISO());
        setTermLength('1 (one) Year');
        setTermStart('');
        setMonthlyRent(0);
        setRentDueDay(1);
        setBouncedCheckFee(45);
        setGuarantorRequired(false);
        setLateDeemedAfterDays(7);
        setLateGraceDays(3);
        setLateFeePerDay(15);
        setLateFeeMax(45);
        setUtilitiesByLandlord('Gas, Water, Sewage, Heat, Garbage, Snow Removal & Lawn Care');
        setElectricFixedFee(50);
        setOtherTenantUtilities('Cable, Internet');
        setSecurityDeposit(0);
        setPetsAllowed(false);
        setRentersInsuranceRequired(true);
        setAdditionalTerms('');
        setLandlordName('CVP Properties 4.0 LLC');
        setContactPhone('(518) 405-9055');
        setRepresentativeName('Valentian Paulsen');
    };

    const handlePrint = () => window.print();

    const propertyLine = [propertyStreet, propertyCityStateZip].filter(Boolean).join(', ') || '[Property Address]';
    const tenantList = tenantNames.trim() || '[Tenant Name(s)]';
    const unitDescription = unitLabel.trim() || '[Unit / Floor]';

    const clauses: Clause[] = [
        {
            title: 'Premises',
            body: (
                <>
                    The premises leased is a <strong>{unitDescription}</strong> with:
                    <br />(a) {bedrooms} bedroom(s)
                    <br />(b) {bathrooms} bathroom(s)
                    {parkingDescription && <><br />(c) {parkingDescription}</>}
                    {garageAvailable && <><br />(d) Garage (optional at {fmtMoney(garageFee)}/month)</>}
                    <br />located at <strong>{propertyLine}</strong> (the &quot;Premises&quot;).
                </>
            ),
        },
        {
            title: 'Agreement to Lease',
            body: 'Landlord agrees to lease to Tenant and Tenant agrees to lease from Landlord, according to the terms and conditions set forth herein, the Premises.',
        },
        {
            title: 'Term',
            body: (
                <>
                    This Agreement shall be considered as a: <strong>{termLength}</strong> Lease. This Agreement will be for a
                    term beginning on <strong>{formatDate(termStart)}</strong> (the &quot;Term&quot;). At the end of the Term,
                    the Tenant must vacate the Premises. Unless this Agreement has been extended by mutual written agreement of
                    the Parties, there will be no holding over past the Term under the terms of this Agreement under any
                    circumstances. If it becomes necessary to commence legal action to remove Tenant from the Premises, the
                    prevailing Party will be entitled to attorney&apos;s fees and costs in addition to damages.
                </>
            ),
        },
        {
            title: 'Rent',
            body: (
                <>
                    Tenant will pay Landlord a monthly rent of <strong>{fmtMoney(monthlyRent)}</strong>. Rent will be payable in
                    advance and due on the <strong>{ordinal(rentDueDay)}</strong> day of each month during the Term. The
                    security deposit is payable to Landlord when Tenant signs this Agreement. Rent will be paid to Landlord by
                    mail or in person by personal check or electronic transfer, and will be payable in U.S. Dollars.
                    <br /><br />
                    <strong>Proration:</strong> Rent for any period during the Term which is for less than one month will be a
                    pro rata portion of the monthly installment.
                    <br />
                    <strong>Bounced Checks:</strong> Tenant agrees to pay {fmtMoney(bouncedCheckFee)} for each dishonored bank
                    check.
                </>
            ),
        },
        {
            title: 'Guaranty',
            body: guarantorRequired
                ? 'A guarantor IS required for the Tenant.'
                : 'A guarantor is NOT required for the Tenant.',
        },
        {
            title: 'Late Fee',
            body: (
                <>
                    A late fee will be charged if rent is not paid on time. Rent paid after {lateDeemedAfterDays} days of each
                    month will be deemed as late; and if rent is not paid within {lateGraceDays} days after such due date, Tenant
                    agrees to pay {fmtMoney(lateFeePerDay)} a day up to {fmtMoney(lateFeeMax)}.
                </>
            ),
        },
        {
            title: 'Utilities & Maintenance',
            body: (
                <>
                    Tenant and Landlord are responsible for payment of all utility and other services for the Premises as
                    follows:
                    <br /><strong>Paid by Landlord:</strong> {utilitiesByLandlord || 'None'}.
                    <br /><strong>Paid by Tenant:</strong> Electric{electricFixedFee > 0 ? ` (fixed ${fmtMoney(electricFixedFee)}/month)` : ''}
                    {otherTenantUtilities ? `, ${otherTenantUtilities}` : ''}.
                </>
            ),
        },
        {
            title: 'Security Deposit',
            body: (
                <>
                    Upon signing this Agreement, Tenant will pay a security deposit in the amount of{' '}
                    <strong>{fmtMoney(securityDeposit)}</strong> to Landlord. The security deposit will be retained by Landlord
                    as security for Tenant&apos;s performance of its obligations under this Agreement. The security deposit may
                    not be used or deducted by Tenant as the last month&apos;s rent of the Term. Tenant will be entitled to a
                    full refund of the security deposit if Tenant returns possession of the Premises to Landlord in the same
                    condition as accepted, ordinary wear and tear excepted. Within the timeframe required by applicable law
                    after the termination of this Agreement, Landlord will return the security deposit to Tenant (minus any
                    amount applied by Landlord in accordance with this section). Any reason for retaining a portion of the
                    security deposit will be explained in writing.
                </>
            ),
        },
        {
            title: 'Use of Premises',
            body: 'The Premises will be occupied only by Tenant and Tenant’s immediate family and used only for residential purposes. Tenant will not engage in any objectionable conduct, including behavior which will make the Premises less fit to live in, will cause dangerous, hazardous or unsanitary conditions or will interfere with the rights of others to enjoy their property. Tenant will be liable for any damage occurring to the Premises and any damage to or loss of the contents thereof which is done by Tenant or Tenant’s guests or invitees.',
        },
        {
            title: 'Condition of the Premises',
            body: 'Tenant has examined the Premises, including the appliances and fixtures (and furnishings), and acknowledges that they are in good condition and repair, normal wear and tear excepted, and accepts them in its current condition.',
        },
        {
            title: 'Maintenance and Repairs',
            body: 'Tenant will maintain the Premises, including all appliances and fixtures (and furnishings), in clean, sanitary and good condition and repair. Tenant will not remove Landlord’s appliances and fixtures (and furnishings) from the Premises for any purpose. If repairs other than general maintenance are required, Tenant will notify Landlord for such repairs. In the event of default by Tenant, Tenant will reimburse Landlord for the cost of any repairs or replacement.',
        },
        {
            title: 'Compliance',
            body: 'Tenant agrees to comply with all applicable laws, ordinances, requirements and regulations of any federal, state, county, municipal or other authority.',
        },
        {
            title: 'Mechanics’ Lien',
            body: 'Tenant understands and agrees that Tenant and anyone acting on Tenant’s behalf does not have the right to file for mechanic’s liens or any other kind of liens on the Premises. Tenant agrees to give actual advance notice to any contractors, subcontractors or suppliers of goods, labor or services that such liens are invalid. Tenant further agrees to take the additional steps necessary to keep the Premises free of any and all liens that may result from construction completed by or for Tenant.',
        },
        {
            title: 'Alterations',
            body: 'Tenant will not make any alteration, addition or improvement to the Premises without first obtaining Landlord’s written consent. Any and all alterations, additions or improvements to the Premises are without payment to Tenant and will become Landlord’s property immediately on completion and remain on the Premises, unless Landlord requests or permits removal, in which case Tenant will return that part of the Premises to the same condition as existed prior to the alteration, addition or improvement. Tenant will not change any existing locks or install any additional locks on the Premises without first obtaining Landlord’s written consent and without providing Landlord a copy of all keys.',
        },
        {
            title: 'Smoking/Vaping',
            body: 'Smoking of any kind is strictly prohibited on any part of the Premises. This prohibition applies to Tenant and any visitor, guest or other occupant on the Premises.',
        },
        {
            title: 'Pets',
            body: petsAllowed
                ? 'Pets are permitted subject to Landlord’s prior written approval. Tenant is responsible for any damage caused by a pet.'
                : 'Tenant is NOT allowed to have or keep any pets, even temporarily, on any part of the Premises.',
        },
        {
            title: 'Fire and Casualty',
            body: 'If the Premises are damaged by fire or other serious disaster or accident and the Premises becomes uninhabitable as a result, (a) Tenant may immediately vacate the Premises and terminate this Agreement upon notice to Landlord or (b) Landlord may terminate this Agreement upon notice to Tenant. Tenant will be responsible for any unpaid rent or will receive any prepaid rent up to the day of such fire, disaster or accident. If the Premises are only partially damaged and inhabitable, Landlord may make full repairs and will do so within a prompt and reasonable amount of time. At the discretion of Landlord, the rent may be reduced while the repairs are being made.',
        },
        {
            title: 'Liability',
            body: 'Landlord is not responsible or liable for any loss, claim, damage or expense as a result of any accident, injury or damage to any person or property occurring anywhere on the Premises, unless resulting from the negligence or willful misconduct of Landlord.',
        },
        ...(rentersInsuranceRequired ? [{
            title: 'Renter’s Insurance',
            body: 'Tenant is required to obtain, and maintain at all times during the Term, a renter’s insurance policy. Tenant will name Landlord as an interested party or additional insured. Tenant will provide Landlord with a certificate or proof of insurance upon request.',
        }] : []),
        {
            title: 'Assignment and Subletting',
            body: 'Tenant will NOT assign this Agreement as to any portion or all of the Premises or make or permit any total or partial sublease or other transfer of any portion or all of the Premises.',
        },
        {
            title: 'Right of Entry',
            body: 'Landlord may enter the Premises at reasonable times with timely notice to inspect the Premises, to make any alterations, improvements or repairs or to show the Premises to a prospective tenant, buyer or lender. In the event of an emergency, Landlord may enter the Premises at any time.',
        },
        {
            title: 'Surrender',
            body: 'Tenant will deliver and surrender to Landlord possession of the Premises immediately upon the expiration of the Term or the termination of this Agreement, clean and in as good condition and repair as the Premises was at the commencement of the Term, reasonable wear and tear excepted.',
        },
        {
            title: 'Subordination',
            body: 'This Agreement and Tenant’s right under it shall be subject and subordinate to the lien, operation and effect of each existing or future mortgage, deed of trust, ground lease and/or any other similar instrument of encumbrance covering any or all of the Premises, if any, and each renewal, modification, consolidation, replacement or extension thereof.',
        },
        {
            title: 'Disputes',
            body: 'Any dispute arising from this Agreement shall be resolved through mediation, then binding arbitration. If the dispute cannot be resolved through mediation, then the dispute will be resolved through binding arbitration conducted in accordance with the rules of the American Arbitration Association.',
        },
        {
            title: 'Amendments',
            body: 'This Agreement may be amended or modified only by a written agreement signed by the Parties.',
        },
        {
            title: 'Entire Agreement',
            body: 'This Agreement constitutes the entire agreement between the Parties and supersedes and cancels all prior agreements of the Parties, whether written or oral, with respect to the subject matter.',
        },
        ...(additionalTerms ? [{
            title: 'Additional Terms',
            body: <span className="whitespace-pre-wrap">{additionalTerms}</span>,
        }] : []),
    ];

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
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Parties &amp; Premises</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Tenant Name(s)" span2 hint="Separate multiple names with commas">
                            <input value={tenantNames} onChange={e => setTenantNames(e.target.value)} placeholder="Jane Doe, John Doe" className="input" />
                        </Field>
                        <Field label="Unit / Floor Description" span2 hint='e.g. "1st Floor furnished apartment"'>
                            <input value={unitLabel} onChange={e => setUnitLabel(e.target.value)} placeholder="1st Floor furnished apartment" className="input" />
                        </Field>
                        <Field label="Bedrooms">
                            <input type="number" value={bedrooms || ''} onChange={e => setBedrooms(Number(e.target.value) || 0)} className="input font-mono" />
                        </Field>
                        <Field label="Bathrooms">
                            <input type="number" value={bathrooms || ''} onChange={e => setBathrooms(Number(e.target.value) || 0)} className="input font-mono" />
                        </Field>
                        <Field label="Parking (optional)" span2>
                            <input value={parkingDescription} onChange={e => setParkingDescription(e.target.value)} placeholder="1 parking space in the back, 1 on the street" className="input" />
                        </Field>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 col-span-2">
                            <input type="checkbox" checked={garageAvailable} onChange={e => setGarageAvailable(e.target.checked)} className="h-3.5 w-3.5" />
                            Garage available (optional add-on)
                        </label>
                        {garageAvailable && (
                            <Field label="Garage Fee ($/month)">
                                <input type="number" value={garageFee || ''} onChange={e => setGarageFee(Number(e.target.value) || 0)} className="input font-mono" />
                            </Field>
                        )}
                        <Field label="Property Street Address">
                            <input value={propertyStreet} onChange={e => setPropertyStreet(e.target.value)} placeholder="67 Grand Blvd." className="input" />
                        </Field>
                        <Field label="City, State, ZIP">
                            <input value={propertyCityStateZip} onChange={e => setPropertyCityStateZip(e.target.value)} placeholder="Binghamton, NY 13905" className="input" />
                        </Field>
                        <Field label="Date of Agreement" span2>
                            <input type="date" value={dateOfAgreement} onChange={e => setDateOfAgreement(e.target.value)} className="input" />
                        </Field>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Lease Term</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Term Length" hint='e.g. "1 (one) Year"'>
                            <input value={termLength} onChange={e => setTermLength(e.target.value)} className="input" />
                        </Field>
                        <Field label="Term Starts">
                            <input type="date" value={termStart} onChange={e => setTermStart(e.target.value)} className="input" />
                        </Field>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Rent &amp; Fees</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Monthly Rent ($)">
                            <input type="number" value={monthlyRent || ''} onChange={e => setMonthlyRent(Number(e.target.value) || 0)} placeholder="2000" className="input font-mono" />
                        </Field>
                        <Field label="Due Day of Month">
                            <input type="number" min={1} max={31} value={rentDueDay || ''} onChange={e => setRentDueDay(Number(e.target.value) || 1)} className="input font-mono" />
                        </Field>
                        <Field label="Bounced Check Fee ($)">
                            <input type="number" value={bouncedCheckFee || ''} onChange={e => setBouncedCheckFee(Number(e.target.value) || 0)} className="input font-mono" />
                        </Field>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 col-span-2 pt-2">
                            <input type="checkbox" checked={guarantorRequired} onChange={e => setGuarantorRequired(e.target.checked)} className="h-3.5 w-3.5" />
                            Guarantor required
                        </label>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Late Fee</span>
                        <div className="grid grid-cols-3 gap-3">
                            <Field label="Late After (days)">
                                <input type="number" value={lateDeemedAfterDays || ''} onChange={e => setLateDeemedAfterDays(Number(e.target.value) || 0)} className="input font-mono" />
                            </Field>
                            <Field label="Grace (days)">
                                <input type="number" value={lateGraceDays || ''} onChange={e => setLateGraceDays(Number(e.target.value) || 0)} className="input font-mono" />
                            </Field>
                            <Field label="$/day">
                                <input type="number" value={lateFeePerDay || ''} onChange={e => setLateFeePerDay(Number(e.target.value) || 0)} className="input font-mono" />
                            </Field>
                        </div>
                        <Field label="Max Late Fee ($)">
                            <input type="number" value={lateFeeMax || ''} onChange={e => setLateFeeMax(Number(e.target.value) || 0)} className="input font-mono" />
                        </Field>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Utilities</h2>
                    <Field label="Paid by Landlord">
                        <input value={utilitiesByLandlord} onChange={e => setUtilitiesByLandlord(e.target.value)} className="input" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Electric — Fixed Fee ($/month)" hint="0 = not fixed">
                            <input type="number" value={electricFixedFee || ''} onChange={e => setElectricFixedFee(Number(e.target.value) || 0)} className="input font-mono" />
                        </Field>
                        <Field label="Other Tenant-Paid Utilities">
                            <input value={otherTenantUtilities} onChange={e => setOtherTenantUtilities(e.target.value)} className="input" />
                        </Field>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Deposit, Pets &amp; Insurance</h2>
                    <Field label="Security Deposit ($)">
                        <input type="number" value={securityDeposit || ''} onChange={e => setSecurityDeposit(Number(e.target.value) || 0)} placeholder="1500" className="input font-mono" />
                    </Field>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <input type="checkbox" checked={petsAllowed} onChange={e => setPetsAllowed(e.target.checked)} className="h-3.5 w-3.5" />
                        Pets allowed
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <input type="checkbox" checked={rentersInsuranceRequired} onChange={e => setRentersInsuranceRequired(e.target.checked)} className="h-3.5 w-3.5" />
                        Renter&apos;s insurance required
                    </label>
                    <Field label="Additional Terms / Addendum (optional)">
                        <textarea value={additionalTerms} onChange={e => setAdditionalTerms(e.target.value)} rows={3} className="input resize-none text-xs" />
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
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">State of NY</p>
                            <h1 className="text-2xl font-black uppercase tracking-tight">Lease Agreement</h1>
                        </div>

                        <div className="px-10 py-8 space-y-6 text-sm leading-relaxed text-slate-700">
                            <p>
                                This Lease Agreement (this &quot;Agreement&quot;) is made on{' '}
                                <strong className="text-slate-900">{formatDate(dateOfAgreement)}</strong> by and between:
                                <br />Landlord: <strong className="text-slate-900">{landlordName || '[Landlord]'}</strong>
                                <br />Tenant(s): <strong className="text-slate-900">{tenantList}</strong>
                            </p>
                            <p className="text-xs text-slate-500">
                                In the event there is more than one Tenant, each reference to &quot;Tenant&quot; shall apply to
                                each of them, jointly and severally. Each Tenant is jointly and severally liable to Landlord for
                                payment of rent and performance in accordance with all other terms of this Agreement. Each
                                Landlord and Tenant may be referred to individually as a &quot;Party&quot; and collectively as
                                the &quot;Parties.&quot;
                            </p>

                            {clauses.map((c, i) => (
                                <Fragment key={c.title}>
                                    <Clause n={i + 1} title={c.title}>{c.body}</Clause>
                                </Fragment>
                            ))}

                            <p className="pt-2 font-semibold text-slate-900">
                                IN WITNESS WHEREOF, the Parties hereto, individually or by their duly authorized
                                representatives, have executed this Agreement as of the Effective Date.
                            </p>

                            <div className="grid grid-cols-2 gap-8 pt-6">
                                <div className="space-y-1">
                                    <div className="w-full border-b border-slate-400 mt-10" />
                                    <p className="font-black text-slate-900 pt-1 text-center">Landlord Signature</p>
                                    <div className="w-full border-b border-slate-400 mt-6" />
                                    <p className="font-black text-slate-900 pt-1 text-center">{representativeName || '[Landlord Full Name]'}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="w-full border-b border-slate-400 mt-10" />
                                    <p className="font-black text-slate-900 pt-1 text-center">Tenant Signature</p>
                                    <div className="w-full border-b border-slate-400 mt-6" />
                                    <p className="font-black text-slate-900 pt-1 text-center">{tenantList}</p>
                                </div>
                            </div>

                            <hr className="border-slate-200 mt-4" />
                            <p className="text-[10px] text-slate-400 text-center">
                                This document is a lease template provided for planning convenience and does not constitute
                                legal advice. Landlord-tenant law varies significantly by state and locality — have this
                                agreement reviewed by a qualified attorney before use, and confirm required disclosures (e.g.,
                                lead paint, security deposit handling) for your jurisdiction.
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

function Field({ label, span2, hint, children }: { label: string; span2?: boolean; hint?: string; children: React.ReactNode }) {
    return (
        <label className={`block space-y-1 ${span2 ? 'col-span-2' : ''}`}>
            {label && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>}
            {children}
            {hint && <span className="block text-[10px] text-slate-400">{hint}</span>}
        </label>
    );
}

function Clause({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-900 mb-1.5">
                <span className="w-1 h-4 bg-blue-600 rounded-full" /> {n}. {title}
            </h3>
            <p>{children}</p>
        </div>
    );
}
