// Client-side export of the Residential Lease Agreement as a real .docx or
// .pdf download. The text is read from the on-screen preview itself, so a
// downloaded file always matches exactly what the landlord sees (with every
// form value filled in). The docx/jspdf libraries are loaded on demand so they
// only download when someone actually clicks a download button.

export interface Run { text: string; bold: boolean }
type Para = Run[];

export interface LeaseExportData {
    introBlocks: Para[][];               // paragraphs before clause 1 (each block may span several lines)
    clauses: { n: number; title: string; paras: Para[] }[];
    witness: string;
    landlordName: string;
    representativeName: string;
    tenantList: string;
    guarantorRequired: boolean;
}

// ---------------------------------------------------------------- extraction

function runsOf(node: Element): Para[] {
    const paras: Para[] = [[]];
    const walk = (n: Node, bold: boolean) => {
        n.childNodes.forEach(c => {
            if (c.nodeType === 3) {
                const t = (c.textContent || '').replace(/\s+/g, ' ');
                if (t) paras[paras.length - 1].push({ text: t, bold });
            } else if (c.nodeType === 1) {
                const el = c as Element;
                if (el.tagName === 'BR') paras.push([]);
                else walk(el, bold || el.tagName === 'STRONG');
            }
        });
    };
    walk(node, false);
    return paras
        .map(p => {
            if (p.length) {
                p[0] = { ...p[0], text: p[0].text.replace(/^\s+/, '') };
                p[p.length - 1] = { ...p[p.length - 1], text: p[p.length - 1].text.replace(/\s+$/, '') };
            }
            return p.filter(r => r.text !== '');
        })
        .filter(p => p.length);
}

export function extractLease(
    previewRoot: HTMLElement,
    meta: Pick<LeaseExportData, 'landlordName' | 'representativeName' | 'tenantList' | 'guarantorRequired'>
): LeaseExportData {
    const body = previewRoot.children[1] as HTMLElement;
    const data: LeaseExportData = { introBlocks: [], clauses: [], witness: '', ...meta };
    Array.from(body.children).forEach(ch => {
        const h3 = ch.tagName === 'DIV' ? ch.querySelector(':scope > h3') : null;
        if (h3) {
            const m = (h3 as HTMLElement).innerText.trim().match(/^(\d+)\.\s*(.*)$/);
            const p = ch.querySelector(':scope > p');
            if (m && p) data.clauses.push({ n: Number(m[1]), title: m[2], paras: runsOf(p) });
        } else if (ch.tagName === 'P' && data.clauses.length === 0) {
            data.introBlocks.push(runsOf(ch));
        } else if (ch.tagName === 'P' && /IN WITNESS/i.test((ch as HTMLElement).innerText)) {
            data.witness = (ch as HTMLElement).innerText.replace(/\s+/g, ' ').trim();
        }
    });
    return data;
}

export function leaseFileName(tenantList: string, ext: 'docx' | 'pdf') {
    const who = tenantList.replace(/^\[.*\]$/, '').replace(/[^\w\- ,]+/g, '').trim().slice(0, 60) || 'Draft';
    return `Lease Agreement - ${who}.${ext}`;
}

export function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------------- docx

export async function buildLeaseDocx(data: LeaseExportData): Promise<Blob> {
    const {
        Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType,
        BorderStyle, Footer, PageNumber, TabStopType, HeadingLevel,
    } = await import('docx');

    const FONT = 'Times New Roman';
    const toRuns = (p: Para) => p.map(r => new TextRun({ text: r.text, bold: r.bold }));
    const kids: InstanceType<typeof Paragraph | typeof Table>[] = [];

    kids.push(new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 40 },
        children: [new TextRun({ text: 'STATE OF NEW YORK', size: 20, color: '555555', characterSpacing: 40 })],
    }));
    kids.push(new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 240 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000', space: 6 } },
        children: [new TextRun({ text: 'LEASE AGREEMENT', bold: true, size: 36, characterSpacing: 30 })],
    }));

    data.introBlocks.forEach((block, bi) => {
        block.forEach((p, i) => kids.push(new Paragraph({
            alignment: bi === 0 ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
            spacing: { before: bi === 0 && i === 0 ? 0 : 0, after: bi === 0 ? 40 : 200, line: 264 },
            children: toRuns(p),
        })));
    });

    for (const c of data.clauses) {
        kids.push(new Paragraph({
            heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 200, after: 60 },
            children: [new TextRun({ text: `${c.n}. ${c.title}`, bold: true, size: 22 })],
        }));
        c.paras.forEach((p, i) => kids.push(new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: i === c.paras.length - 1 ? 100 : 60, line: 264 },
            children: toRuns(p),
        })));
    }

    kids.push(new Paragraph({
        pageBreakBefore: true, keepNext: true, alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 0, after: 240, line: 264 },
        children: [new TextRun({ text: data.witness, bold: true })],
    }));

    const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const noBorders = { top: none, bottom: none, left: none, right: none };
    const line = { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 };
    const sigCell = (label: string, name: string) => new TableCell({
        width: { size: 4680, type: WidthType.DXA }, borders: noBorders,
        margins: { top: 60, bottom: 60, left: 120, right: 240 },
        children: [
            new Paragraph({ spacing: { before: 420, after: 0 }, border: { bottom: line }, children: [new TextRun('')] }),
            new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: label, bold: true })] }),
            new Paragraph({ spacing: { before: 300, after: 0 }, border: { bottom: line }, children: [new TextRun('')] }),
            new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: name, bold: true })] }),
            new Paragraph({ spacing: { before: 300, after: 0 }, border: { bottom: line }, children: [new TextRun('')] }),
            new Paragraph({ children: [new TextRun({ text: 'Date', bold: true })] }),
        ],
    });
    const emptyCell = new TableCell({ width: { size: 4680, type: WidthType.DXA }, borders: noBorders, children: [new Paragraph('')] });

    kids.push(new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 4680],
        rows: [new TableRow({
            cantSplit: true,
            children: [
                sigCell(`Landlord — ${data.landlordName || '[Landlord]'}`, `By: ${data.representativeName || '[Landlord Full Name]'}`),
                sigCell('Tenant Signature', `Printed Name: ${data.tenantList}`),
            ],
        })],
    }));
    if (data.guarantorRequired) {
        kids.push(new Table({
            width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 4680],
            rows: [new TableRow({ cantSplit: true, children: [sigCell('Guarantor Signature', 'Guarantor Full Name'), emptyCell] })],
        }));
    }

    const doc = new Document({
        creator: data.landlordName || 'CVP Properties 4.0 LLC',
        title: 'Residential Lease Agreement',
        styles: {
            default: { document: { run: { font: FONT, size: 22 } } },
            paragraphStyles: [{
                id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                run: { font: FONT, size: 22, bold: true }, paragraph: { spacing: { before: 200, after: 60 }, outlineLevel: 1 },
            }],
        },
        sections: [{
            properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1200, left: 1440 } } },
            footers: {
                default: new Footer({
                    children: [new Paragraph({
                        tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
                        children: [
                            new TextRun({ text: 'Landlord Initials: ______   Tenant Initials: ______', size: 18, color: '555555' }),
                            new TextRun({ children: ['\tPage ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], size: 18, color: '555555' }),
                        ],
                    })],
                }),
            },
            children: kids,
        }],
    });
    return Packer.toBlob(doc);
}

// ----------------------------------------------------------------------- pdf

interface Atom { text: string; bold: boolean; gapBefore: boolean }

function toAtoms(p: Para): Atom[] {
    const atoms: Atom[] = [];
    let pendingGap = false;
    for (const r of p) {
        for (const chunk of r.text.split(/(\s+)/)) {
            if (chunk === '') continue;
            if (/^\s+$/.test(chunk)) { pendingGap = true; continue; }
            atoms.push({ text: chunk, bold: r.bold, gapBefore: pendingGap && atoms.length > 0 });
            pendingGap = false;
        }
    }
    return atoms;
}

export async function buildLeasePdf(data: LeaseExportData): Promise<Blob> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const PAGE_W = 612, PAGE_H = 792, LEFT = 72, WIDTH = 468, TOP = 66, BOTTOM = PAGE_H - 66;
    const SIZE = 10.5, LEADING = 13.2;
    let y = TOP;

    const font = (bold: boolean) => doc.setFont('times', bold ? 'bold' : 'normal');
    // jsPDF's getTextWidth() subtracts kerning-pair adjustments that its own
    // output never applies, so it under-measures words (e.g. bold "Year") and
    // squeezes the space after them. Summing single-character widths has no
    // kerning and matches how the text is actually drawn.
    const charWidths = new Map<string, number>();
    const charW = (ch: string, bold: boolean) => {
        const key = (bold ? 'b' : 'n') + ch;
        let w = charWidths.get(key);
        if (w === undefined) { font(bold); doc.setFontSize(SIZE); w = doc.getTextWidth(ch); charWidths.set(key, w); }
        return w;
    };
    const measure = (t: string, bold: boolean) => { let w = 0; for (const ch of t) w += charW(ch, bold); return w; };
    const ensure = (h: number) => { if (y + h > BOTTOM) { doc.addPage(); y = TOP; } };

    // Lays out one paragraph with mixed bold runs, wrapping and (optionally) justifying.
    const paragraph = (p: Para, opts: { justify?: boolean; after?: number; before?: number; forceBold?: boolean } = {}) => {
        const { justify = true, after = 3, before = 0, forceBold = false } = opts;
        const atoms = toAtoms(p).map(a => (forceBold ? { ...a, bold: true } : a));
        if (!atoms.length) return;
        const spaceW = measure(' ', false);
        const lines: Atom[][] = [[]];
        let lineW = 0;
        for (const a of atoms) {
            const w = measure(a.text, a.bold);
            const add = (lines[lines.length - 1].length && a.gapBefore ? spaceW : 0) + w;
            if (lines[lines.length - 1].length && lineW + add > WIDTH) { lines.push([a]); lineW = w; }
            else { lines[lines.length - 1].push(a); lineW += add; }
        }
        y += before;
        lines.forEach((line, li) => {
            ensure(LEADING);
            const widths = line.map(a => measure(a.text, a.bold));
            const gaps = line.filter((a, i) => i > 0 && a.gapBefore).length;
            const natural = widths.reduce((s, w) => s + w, 0) + gaps * spaceW;
            const isLast = li === lines.length - 1;
            const gapW = justify && !isLast && gaps > 0 ? spaceW + (WIDTH - natural) / gaps : spaceW;
            let x = LEFT;
            line.forEach((a, i) => {
                if (i > 0 && a.gapBefore) x += gapW;
                font(a.bold); doc.setFontSize(SIZE); doc.text(a.text, x, y + SIZE);
                x += widths[i];
            });
            y += LEADING;
        });
        y += after;
    };

    // Title block
    doc.setFont('times', 'normal'); doc.setFontSize(9); doc.setTextColor(85);
    doc.text('STATE OF NEW YORK', PAGE_W / 2, y + 9, { align: 'center', charSpace: 1.5 });
    doc.setTextColor(0); y += 16;
    doc.setFont('times', 'bold'); doc.setFontSize(19);
    doc.text('LEASE AGREEMENT', PAGE_W / 2, y + 19, { align: 'center', charSpace: 1.5 });
    y += 27; doc.setLineWidth(1.2); doc.line(LEFT, y, LEFT + WIDTH, y); y += 14;

    data.introBlocks.forEach((block, bi) => block.forEach((p, i) => paragraph(p, {
        justify: bi !== 0, after: bi === 0 ? (i === block.length - 1 ? 6 : 2) : 8,
    })));

    for (const c of data.clauses) {
        ensure(LEADING * 2.5);
        paragraph([{ text: `${c.n}. ${c.title}`, bold: true }], { justify: false, before: 6, after: 2 });
        c.paras.forEach(p => paragraph(p));
    }

    // Signature page
    doc.addPage(); y = TOP;
    paragraph([{ text: data.witness, bold: true }], { forceBold: true, after: 22 });

    const sigBlock = (x: number, label: string, name: string, top: number) => {
        let yy = top;
        const w = 216;
        [['', label], ['', name], ['', 'Date']].forEach(([, text], i) => {
            yy += i === 0 ? 30 : 24;
            doc.setLineWidth(0.8); doc.line(x, yy, x + w, yy);
            doc.setFont('times', 'bold'); doc.setFontSize(SIZE); doc.text(text, x, yy + 12);
            yy += 12;
        });
        return yy;
    };
    const rowBottom = Math.max(
        sigBlock(LEFT, `Landlord — ${data.landlordName || '[Landlord]'}`, `By: ${data.representativeName || '[Landlord Full Name]'}`, y),
        sigBlock(LEFT + 252, 'Tenant Signature', `Printed Name: ${data.tenantList}`, y),
    );
    if (data.guarantorRequired) {
        doc.setFont('times', 'italic'); doc.setFontSize(9);
        doc.text('Guarantor (required under Section 6)', LEFT, rowBottom + 26);
        sigBlock(LEFT, 'Guarantor Signature', 'Guarantor Full Name', rowBottom + 8);
    }

    // Footer on every page
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(85);
        doc.text('Landlord Initials: ______    Tenant Initials: ______', LEFT, PAGE_H - 40);
        doc.text(`Page ${i} of ${total}`, LEFT + WIDTH, PAGE_H - 40, { align: 'right' });
        doc.setTextColor(0);
    }
    doc.setProperties({ title: 'Residential Lease Agreement', author: data.landlordName || 'CVP Properties 4.0 LLC' });
    return doc.output('blob');
}
