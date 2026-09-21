'use client';

import { useEffect, useRef, useState, Fragment } from 'react';
import { Printer, ArrowLeft, Save, RotateCcw, Check, Download } from 'lucide-react';
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
    dateOfAgreement: string; termLength: string; termStart: string; holdoverPercent: number;
    monthlyRent: number; rentDueDay: number; bouncedCheckFee: number; guarantorRequired: boolean;
    lateGraceDays: number; lateFeePerDay: number; lateFeeMax: number;
    utilitiesByLandlord: string; electricFixedFee: number; otherTenantUtilities: string;
    securityDeposit: number; petsAllowed: boolean; rentersInsuranceRequired: boolean; additionalTerms: string;
    landlordName: string; contactPhone: string; representativeName: string; landlordNoticeAddress: string;
    quietHours: string; guestDays: number;
}

// New York caps residential late fees at the lesser of $50 or 5% of the
// monthly rent, and bars charging one before the rent is 5 days late
// (RPL §238-a). The lease text below is computed from these so a fee entered
// in the form can never print above the legal limit.
const NY_LATE_FEE_MAX_DOLLARS = 50;
const NY_LATE_FEE_MAX_RENT_PERCENT = 0.05;
const NY_LATE_FEE_MIN_GRACE_DAYS = 5;

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
    const [holdoverPercent, setHoldoverPercent] = useState<number>(150);

    const [monthlyRent, setMonthlyRent] = useState<number>(0);
    const [rentDueDay, setRentDueDay] = useState<number>(1);
    const [bouncedCheckFee, setBouncedCheckFee] = useState<number>(45);
    const [guarantorRequired, setGuarantorRequired] = useState(false);
    const [lateGraceDays, setLateGraceDays] = useState<number>(5);
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
    const [landlordNoticeAddress, setLandlordNoticeAddress] = useState('');
    const [quietHours, setQuietHours] = useState('10:00 p.m. and 8:00 a.m.');
    const [guestDays, setGuestDays] = useState<number>(14);
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
            if (draft.holdoverPercent !== undefined) setHoldoverPercent(draft.holdoverPercent);
            if (draft.monthlyRent !== undefined) setMonthlyRent(draft.monthlyRent);
            if (draft.rentDueDay !== undefined) setRentDueDay(draft.rentDueDay);
            if (draft.bouncedCheckFee !== undefined) setBouncedCheckFee(draft.bouncedCheckFee);
            if (draft.guarantorRequired !== undefined) setGuarantorRequired(draft.guarantorRequired);
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
            if (draft.landlordNoticeAddress !== undefined) setLandlordNoticeAddress(draft.landlordNoticeAddress);
            if (draft.quietHours !== undefined) setQuietHours(draft.quietHours);
            if (draft.guestDays !== undefined) setGuestDays(draft.guestDays);
        }
        setHydrated(true);
    }, []);

    const currentDraft = () => ({
        tenantNames, propertyStreet, unitLabel, propertyCityStateZip, bedrooms, bathrooms,
        parkingDescription, garageAvailable, garageFee, dateOfAgreement, termLength, termStart,
        holdoverPercent, monthlyRent, rentDueDay, bouncedCheckFee, guarantorRequired,
        lateGraceDays, lateFeePerDay, lateFeeMax, utilitiesByLandlord, electricFixedFee,
        otherTenantUtilities, securityDeposit, petsAllowed, rentersInsuranceRequired,
        additionalTerms, landlordName, contactPhone, representativeName, landlordNoticeAddress,
        quietHours, guestDays,
    });

    useEffect(() => {
        if (!hydrated) return;
        saveDraft(DRAFT_KEY, currentDraft());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hydrated, tenantNames, propertyStreet, unitLabel, propertyCityStateZip, bedrooms, bathrooms,
        parkingDescription, garageAvailable, garageFee, dateOfAgreement, termLength, termStart,
        holdoverPercent, monthlyRent, rentDueDay, bouncedCheckFee, guarantorRequired,
        lateGraceDays, lateFeePerDay, lateFeeMax, utilitiesByLandlord, electricFixedFee,
        otherTenantUtilities, securityDeposit, petsAllowed, rentersInsuranceRequired,
        additionalTerms, landlordName, contactPhone, representativeName, landlordNoticeAddress,
        quietHours, guestDays]);

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
        setHoldoverPercent(150);
        setMonthlyRent(0);
        setRentDueDay(1);
        setBouncedCheckFee(45);
        setGuarantorRequired(false);
        setLateGraceDays(5);
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
        setLandlordNoticeAddress('');
        setQuietHours('10:00 p.m. and 8:00 a.m.');
        setGuestDays(14);
    };

    const handlePrint = () => window.print();

    // Real .docx / .pdf downloads of the lease as currently filled in. The
    // text is read back from the on-screen preview so the file always matches
    // what's shown; the export libraries load only when a button is clicked.
    const previewRef = useRef<HTMLDivElement>(null);
    const [exporting, setExporting] = useState<null | 'docx' | 'pdf'>(null);
    const handleDownload = async (kind: 'docx' | 'pdf') => {
        if (!previewRef.current) return;
        setExporting(kind);
        try {
            const { extractLease, buildLeaseDocx, buildLeasePdf, downloadBlob, leaseFileName } = await import('@/lib/leaseExport');
            const data = extractLease(previewRef.current, {
                landlordName: landlordName || '[Landlord]',
                representativeName,
                tenantList: tenantNames.trim() || '[Tenant Name(s)]',
                guarantorRequired,
            });
            const blob = kind === 'docx' ? await buildLeaseDocx(data) : await buildLeasePdf(data);
            downloadBlob(blob, leaseFileName(tenantNames.trim(), kind));
        } catch (err) {
            console.error('Lease download failed', err);
            alert('Sorry, that download failed. You can still use Print / Save as PDF.');
        } finally {
            setExporting(null);
        }
    };

    const propertyLine = [propertyStreet, propertyCityStateZip].filter(Boolean).join(', ') || '[Property Address]';
    const tenantList = tenantNames.trim() || '[Tenant Name(s)]';
    const unitDescription = unitLabel.trim() || '[Unit / Floor]';

    // Late fee as it will actually print: never above the NY cap, never
    // charged before day 5.
    const nyLateFeeCap = monthlyRent > 0
        ? Math.min(NY_LATE_FEE_MAX_DOLLARS, monthlyRent * NY_LATE_FEE_MAX_RENT_PERCENT)
        : NY_LATE_FEE_MAX_DOLLARS;
    const printedLateFeeMax = Math.min(lateFeeMax, nyLateFeeCap);
    const printedLateFeePerDay = Math.min(lateFeePerDay, printedLateFeeMax);
    const printedGraceDays = Math.max(lateGraceDays, NY_LATE_FEE_MIN_GRACE_DAYS);
    const lateFeeAdjusted = lateFeeMax > nyLateFeeCap || lateGraceDays < NY_LATE_FEE_MIN_GRACE_DAYS;
    const depositOverCap = monthlyRent > 0 && securityDeposit > monthlyRent;
    const holdoverDailyRate = monthlyRent > 0 ? ((monthlyRent / 30) * (holdoverPercent / 100)) : 0;

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
            title: 'Holdover',
            body: (
                <>
                    If Tenant remains in possession of the Premises after the expiration or termination of the Term without
                    Landlord&apos;s written consent, Tenant shall pay Landlord use and occupancy for each day of the holdover at
                    a daily rate equal to <strong>{holdoverPercent}%</strong> of the daily rent
                    {monthlyRent > 0 ? <> (currently <strong>{fmtMoney(holdoverDailyRate)}</strong> per day)</> : ''}, calculated
                    by dividing the monthly rent by thirty (30). Tenant shall also be liable for all damages resulting from the
                    holdover, including any lost rent or expense caused by Landlord&apos;s inability to deliver possession to a
                    new tenant, together with reasonable attorney&apos;s fees and costs. To the extent permitted by law,
                    Landlord&apos;s acceptance of any payment after the Term is accepted as use and occupancy only and does not
                    renew this Agreement, create a new tenancy, or waive Landlord&apos;s right to recover possession.
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
                ? 'A guarantor IS required for the Tenant. Each guarantor shall sign a separate written guaranty in a form acceptable to Landlord at or before the signing of this Agreement, and delivery of the signed guaranty is a condition of this Agreement. By signing, each guarantor unconditionally guarantees, jointly and severally with Tenant, the full and timely payment of rent and all other sums due, and the performance of all of Tenant’s obligations, during the Term. Landlord may proceed against a guarantor without first proceeding against Tenant.'
                : 'A guarantor is NOT required for the Tenant.',
        },
        {
            title: 'Late Fee',
            body: (
                <>
                    If rent is not received in full within <strong>{printedGraceDays}</strong> days after its due date, Tenant
                    shall pay a late fee of <strong>{fmtMoney(printedLateFeePerDay)}</strong> for each day thereafter until the
                    rent is paid, not to exceed <strong>{fmtMoney(printedLateFeeMax)}</strong> in total for any late payment. In
                    no event shall late fees exceed the maximum permitted by New York law, which is currently the lesser of fifty
                    dollars ($50) or five percent (5%) of the monthly rent.
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
                    amount applied by Landlord in accordance with this section). Landlord may apply the security deposit to
                    unpaid rent, late fees, and utilities; to the cost of repairing damage beyond ordinary wear and tear; to
                    cleaning the Premises; and to the removal and disposal of property abandoned by Tenant. Landlord will provide
                    Tenant with a written itemized statement of any amount retained, within the time required by law. The
                    security deposit is not a limit on Tenant&apos;s liability, and Tenant remains responsible for any amount owed
                    to Landlord in excess of the deposit. Landlord will hold the security deposit as required by New York law
                    and will provide Tenant with the name and address of the institution holding it.
                </>
            ),
        },
        {
            title: 'Move-In and Move-Out Inspections',
            body: (
                <>
                    <strong>Move-In.</strong> Within seven (7) days after the Term begins, Tenant shall inspect the Premises, note
                    in writing any existing damage or defect on the move-in condition report provided by Landlord, and return the
                    signed report to Landlord. Any condition not noted in a timely written report is presumed to have been in
                    good condition at move-in. Landlord may photograph or record the condition of the Premises at move-in for its
                    records.
                    <br />
                    <strong>Move-Out.</strong> Tenant may request an inspection of the Premises before move-out, as provided by
                    New York law. Landlord will notify Tenant in writing of that right and will offer an inspection date, and
                    Tenant may be present. An inspection does not release Tenant from liability for damage beyond ordinary wear
                    and tear, including damage not identified at the inspection.
                </>
            ),
        },
        {
            title: 'Use of Premises',
            body: 'The Premises will be occupied only by the Tenant(s) named in this Agreement and any other occupants permitted by law, and used only for residential purposes. Tenant will not engage in any objectionable conduct, including behavior which will make the Premises less fit to live in, will cause dangerous, hazardous or unsanitary conditions or will interfere with the rights of others to enjoy their property. Tenant will be liable for any damage occurring to the Premises and any damage to or loss of the contents thereof which is done by Tenant or Tenant’s guests or invitees.',
        },
        {
            title: 'Quiet Hours; Guests',
            body: (
                <>
                    (a) <strong>Quiet Hours.</strong> Between <strong>{quietHours || '[quiet hours]'}</strong> each day, Tenant,
                    all occupants, and their guests shall keep noise, music, and activity at a level that does not disturb
                    neighbors or other occupants of the building. At all other times, Tenant shall not make or permit noise or
                    activity that unreasonably disturbs others. Repeated disturbances after written notice are a breach of
                    this Agreement.
                    <br />(b) <strong>Guests.</strong> Tenant may have guests, and is responsible for their conduct and for any
                    damage they cause. No guest may stay in the Premises for more than <strong>{guestDays || 0}</strong>{' '}
                    consecutive days without Landlord&apos;s prior written consent. A person who stays longer without consent is
                    not a permitted occupant.
                    <br />(c) <strong>Occupants.</strong> Only the Tenant(s) named in this Agreement, and other occupants
                    permitted by New York law, may live in the Premises. Within thirty (30) days after Landlord&apos;s written
                    request, Tenant shall give Landlord the names of all persons occupying the Premises. Tenant is responsible
                    for ensuring that all occupants and guests comply with this Agreement.
                </>
            ),
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
            title: 'Notice of Hazards; Winter Care',
            body: 'Tenant shall promptly notify Landlord in writing of any leak, water intrusion, mold, pest activity, heating, plumbing or electrical failure, or other condition that may cause damage to the Premises or endanger health or safety. To the extent permitted by law, Tenant shall be responsible for damage that results from Tenant’s failure to give prompt notice or from Tenant’s negligence. During cold weather, Tenant shall keep the Premises heated to at least fifty-five (55) degrees Fahrenheit at all times, including when Tenant is away, to prevent frozen pipes. Tenant shall not disable, remove, or tamper with any smoke detector, carbon monoxide detector, or other fire safety equipment, shall replace batteries as needed, and shall promptly report any malfunction to Landlord.',
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
        {
            title: 'Indemnification',
            body: 'To the fullest extent permitted by law, Tenant shall indemnify, defend, and hold harmless Landlord and its members, managers, employees, and agents from and against any claim, loss, liability, damage, or expense, including reasonable attorney’s fees, arising from (a) Tenant’s breach of this Agreement or (b) the acts or omissions of Tenant or Tenant’s family members, guests, invitees, or pets, except to the extent caused by the negligence or willful misconduct of Landlord.',
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
            title: 'Default and Remedies',
            body: (
                <>
                    (a) <strong>Events of Default.</strong> Each of the following is a default by Tenant: (i) failure to pay
                    rent or any other sum when due; (ii) failure to perform any other obligation under this Agreement that is
                    not cured within ten (10) days after written notice from Landlord, or such shorter period as the law permits
                    where the breach cannot be cured or endangers persons or property; and (iii) use of the Premises for any
                    unlawful purpose.
                    <br />(b) <strong>Remedies.</strong> Upon a default, and after giving any notice required by law, Landlord
                    may, to the extent permitted by law, terminate this Agreement or Tenant&apos;s right to possession, commence
                    a proceeding to recover possession of the Premises, and recover all unpaid rent, late fees, and other sums
                    owed, together with damages, the cost of repair and cleaning, and reasonable attorney&apos;s fees and costs.
                    <br />(c) <strong>Reletting.</strong> If Landlord recovers possession before the end of the Term, Tenant
                    remains liable for rent for the balance of the Term, less amounts Landlord actually receives from reletting
                    after using the efforts to relet the Premises that the law requires.
                    <br />(d) <strong>No Waiver; Remedies Cumulative.</strong> To the extent permitted by law, Landlord&apos;s
                    acceptance of a partial or late payment, or delay or failure to exercise any right, is not a waiver of that
                    or any other right or default. Landlord&apos;s remedies are cumulative.
                    <br />(e) <strong>Notice Periods.</strong> Nothing in this section shortens any notice or cure period
                    required by law.
                </>
            ),
        },
        {
            title: 'Subordination',
            body: 'This Agreement and Tenant’s right under it shall be subject and subordinate to the lien, operation and effect of each existing or future mortgage, deed of trust, ground lease and/or any other similar instrument of encumbrance covering any or all of the Premises, if any, and each renewal, modification, consolidation, replacement or extension thereof.',
        },
        {
            title: 'Notices',
            body: (
                <>
                    All notices under this Agreement must be in writing. Notices to Tenant may be delivered by hand, sent by
                    first-class or certified mail addressed to Tenant at the Premises, or sent by email to any email address
                    Tenant has provided to Landlord in writing. Notices to Landlord must be delivered by hand or sent by
                    first-class or certified mail to <strong>{landlordNoticeAddress.trim() || '[Landlord Notice Address]'}</strong>,
                    or to any other address Landlord designates in writing. A notice sent by mail is considered given three (3)
                    days after mailing, and a notice delivered by hand or email is considered given on delivery, except where
                    the law prescribes a different rule for a particular notice.
                </>
            ),
        },
        {
            title: 'Disputes',
            body: (
                <>
                    (a) <strong>Mediation and Arbitration of Monetary Claims.</strong> Any claim for money arising out of this
                    Agreement, including claims concerning security deposit deductions, repair or damage charges, unpaid
                    utilities, and late fees, shall first be submitted to mediation. If the claim is not resolved through
                    mediation, it shall be finally resolved by binding arbitration administered by the American Arbitration
                    Association under its applicable rules. Only the monetary claims described in this subsection are subject
                    to mediation and arbitration. No other dispute under this Agreement, including any matter concerning
                    possession of the Premises, is subject to this subsection.
                    <br />(b) <strong>Attorney&apos;s Fees and Costs.</strong> In any proceeding arising out of this Agreement,
                    the prevailing Party shall be entitled to recover its reasonable attorney&apos;s fees and costs from the
                    non-prevailing Party. This provision applies equally to Landlord and Tenant.
                    <br />(c) <strong>Governing Law; Waivers.</strong> This Agreement shall be governed by and construed in
                    accordance with the laws of the State of New York. To the fullest extent permitted by law, each Party
                    knowingly and voluntarily waives any right to a trial by jury and to participate in a class action in
                    connection with any dispute arising out of this Agreement.
                </>
            ),
        },
        {
            title: 'Amendments',
            body: 'This Agreement may be amended or modified only by a written agreement signed by the Parties.',
        },
        {
            title: 'Severability; Counterparts',
            body: 'If any provision of this Agreement is found to be invalid or unenforceable, that provision shall be enforced to the maximum extent permitted by law, or modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall continue in full force and effect. Time is of the essence with respect to Tenant’s payment obligations. This Agreement may be signed in counterparts and by electronic signature, each of which is an original and all of which together are one instrument.',
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
                        <Field label="Holdover Rate (% of daily rent)" hint="Charged per day if tenant stays past the term">
                            <input type="number" value={holdoverPercent || ''} onChange={e => setHoldoverPercent(Number(e.target.value) || 0)} className="input font-mono" />
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
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Grace (days)" hint="NY minimum: 5">
                                <input type="number" value={lateGraceDays || ''} onChange={e => setLateGraceDays(Number(e.target.value) || 0)} className="input font-mono" />
                            </Field>
                            <Field label="$/day">
                                <input type="number" value={lateFeePerDay || ''} onChange={e => setLateFeePerDay(Number(e.target.value) || 0)} className="input font-mono" />
                            </Field>
                        </div>
                        <Field label="Max Late Fee ($)">
                            <input type="number" value={lateFeeMax || ''} onChange={e => setLateFeeMax(Number(e.target.value) || 0)} className="input font-mono" />
                        </Field>
                        <p className={`text-[11px] leading-relaxed ${lateFeeAdjusted ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                            NY limit{monthlyRent > 0 ? ' for this rent' : ''}: the lesser of $50 or 5% of monthly rent
                            {monthlyRent > 0 ? ` (${fmtMoney(nyLateFeeCap)})` : ''}, and not before day {NY_LATE_FEE_MIN_GRACE_DAYS}.
                            {lateFeeAdjusted
                                ? ` Your entries exceed this, so the lease will print a ${printedGraceDays}-day grace and a ${fmtMoney(printedLateFeeMax)} maximum.`
                                : ''}
                        </p>
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
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">House Rules</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Quiet Hours" hint='Reads: "Between ___ each day"'>
                            <input value={quietHours} onChange={e => setQuietHours(e.target.value)} className="input" />
                        </Field>
                        <Field label="Max Guest Stay (days)" hint="Consecutive days without consent">
                            <input type="number" value={guestDays || ''} onChange={e => setGuestDays(Number(e.target.value) || 0)} className="input font-mono" />
                        </Field>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Deposit, Pets &amp; Insurance</h2>
                    <Field label="Security Deposit ($)">
                        <input type="number" value={securityDeposit || ''} onChange={e => setSecurityDeposit(Number(e.target.value) || 0)} placeholder="1500" className="input font-mono" />
                    </Field>
                    {depositOverCap && (
                        <p className="text-[11px] leading-relaxed text-amber-600 font-semibold -mt-2">
                            New York limits a security deposit to one month&apos;s rent ({fmtMoney(monthlyRent)}). A larger deposit
                            can make the lease unlawful and expose you to penalties.
                        </p>
                    )}
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
                        <Field label="Landlord Notice Address" span2 hint="Where tenants must send written notices">
                            <input value={landlordNoticeAddress} onChange={e => setLandlordNoticeAddress(e.target.value)} placeholder="Street, City, State ZIP" className="input" />
                        </Field>
                    </div>
                </div>

                <button
                    onClick={handlePrint}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-black transition-all shadow-lg active:scale-[0.99]"
                >
                    <Printer className="h-4 w-4" /> Print / Save as PDF
                </button>

                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Download This Lease (filled in)</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleDownload('docx')}
                            disabled={exporting !== null}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-[#2a9d8f] text-white hover:bg-[#238a7e] disabled:opacity-60 transition-colors"
                        >
                            <Download className="h-4 w-4" /> {exporting === 'docx' ? 'Preparing…' : 'Word (.docx)'}
                        </button>
                        <button
                            onClick={() => handleDownload('pdf')}
                            disabled={exporting !== null}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-[#2a9d8f] text-white hover:bg-[#238a7e] disabled:opacity-60 transition-colors"
                        >
                            <Download className="h-4 w-4" /> {exporting === 'pdf' ? 'Preparing…' : 'PDF'}
                        </button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                        Includes everything you entered above, exactly as shown in the preview.
                    </p>
                </div>

                {/* Blank fill-in copies of the full lease (files live in
                    public/lease-template). They're a snapshot of the clause
                    text — regenerate them whenever the clauses above change. */}
                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Blank Lease Template</p>
                    <div className="grid grid-cols-2 gap-3">
                        <a
                            href="/lease-template/Residential-Lease-Agreement.docx"
                            download
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2a9d8f] hover:text-[#2a9d8f] transition-colors"
                        >
                            <Download className="h-4 w-4" /> Word (.docx)
                        </a>
                        <a
                            href="/lease-template/Residential-Lease-Agreement.pdf"
                            download
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2a9d8f] hover:text-[#2a9d8f] transition-colors"
                        >
                            <Download className="h-4 w-4" /> PDF
                        </a>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                        Blank copy with fill-in blanks, for handwriting or for your lawyer.
                    </p>
                </div>
            </div>

            {/* ===================== LIVE PREVIEW ===================== */}
            <div className="print:w-full">
                <div className="xl:sticky xl:top-6">
                    <div ref={previewRef} className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-200 print:shadow-none print:border-none print:rounded-none mx-auto max-w-[850px]">
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

                            {guarantorRequired && (
                                <div className="grid grid-cols-2 gap-8 pt-2">
                                    <div className="space-y-1">
                                        <div className="w-full border-b border-slate-400 mt-10" />
                                        <p className="font-black text-slate-900 pt-1 text-center">Guarantor Signature</p>
                                        <div className="w-full border-b border-slate-400 mt-6" />
                                        <p className="font-black text-slate-900 pt-1 text-center">Guarantor Full Name</p>
                                    </div>
                                </div>
                            )}

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
