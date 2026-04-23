import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoicePDF = (p: any, businessSettings: any, overrides?: any) => {
    const cleanText = (str: string) => (str || "").replace(/[^\x20-\x7E]/g, '');
    
    const toWords = (num: number) => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const n = ('0000000' + num).slice(-7).match(/^(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return '';
        let str = '';
        str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Lakh ' : '';
        str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Thousand ' : '';
        str += (Number(n[3]) !== 0) ? a[Number(n[3])] + 'Hundred ' : '';
        str += (Number(n[4]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) : '';
        return str.trim().toUpperCase() + ' RUPEES ONLY';
    };

    const finalTitle = overrides?.taskTitle || p.taskTitle || p.name || "Service";
    const safeTitle = cleanText(finalTitle);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. TOP HEADER
    if (businessSettings?.logo) {
      try { doc.addImage(businessSettings.logo, 'PNG', 10, 10, 32, 18); } catch (e) {}
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text(businessSettings?.name || "Magic Scale Restaurant", 48, 15);
    doc.text("Consultant", 48, 23);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    const addr = doc.splitTextToSize(businessSettings?.address || "Rajokari, New Delhi - 110038", 70);
    doc.text(addr, 48, 28);
    
    const headerBottom = Math.max(35, 28 + (addr.length * 4));
    const barY = headerBottom + 5;

    const rightInfoX = pageWidth - 65;
    const colonX = pageWidth - 52;
    const valueX = pageWidth - 48;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("Name", rightInfoX, 15);
    doc.text("Phone", rightInfoX, 20);
    doc.text("Email", rightInfoX, 25);
    doc.text("Website", rightInfoX, 30);
    doc.text(":", colonX, 15);
    doc.text(":", colonX, 20);
    doc.text(":", colonX, 25);
    doc.text(":", colonX, 30);
    doc.setFont("helvetica", "normal");
    doc.text("Akash Verma", valueX, 15);
    doc.text(businessSettings?.phone || "8826073117", valueX, 20);
    doc.text(businessSettings?.email || "Support@magicscale.in", valueX, 25);
    doc.text("https://magicscale.in/", valueX, 30);

    // 2. TAX INVOICE BAR
    const boxWidth = (pageWidth - 20) / 3;
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.4);
    doc.rect(10, barY, pageWidth - 20, 10);
    doc.line(10 + boxWidth, barY, 10 + boxWidth, barY + 10);
    doc.line(10 + 2 * boxWidth, barY, 10 + 2 * boxWidth, barY + 10);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`GSTIN : ${businessSettings?.gstin || "07CCJPV6752R1ZF"}`, 12, barY + 6.5);
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.text("TAX INVOICE", 10 + boxWidth + (boxWidth/2), barY + 7, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text("ORIGINAL FOR RECIPIENT", pageWidth - 12, barY + 6.5, { align: 'right' });

    // Client Info Logic
    const finalShopName = overrides?.shopName || p.shopName || p.customerName || p.shop || "-";
    const finalAddress = overrides?.address || p.address || p.location || "-";
    const finalPhone = overrides?.phone || p.phone || "-";
    const finalGSTIN = overrides?.gstin || p.gstin || "-";
    const finalDate = overrides?.date ? new Date(overrides.date).toLocaleDateString() : new Date(p.updatedAt).toLocaleDateString();
    const finalDueDate = overrides?.dueDate ? new Date(overrides.dueDate).toLocaleDateString() : new Date(new Date(p.updatedAt).getTime() + 7*24*60*60*1000).toLocaleDateString();
    
    const stateCodes: { [key: string]: string } = {
        "07": "Delhi (07)", "06": "Haryana (06)", "09": "Uttar Pradesh (09)", "27": "Maharashtra (27)", "08": "Rajasthan (08)", "33": "Tamil Nadu (33)"
    };
    let customerState = "Delhi (07)";

    if (finalGSTIN && finalGSTIN.length >= 2) {
        const code = finalGSTIN.substring(0, 2);
        if (stateCodes[code]) customerState = stateCodes[code];
    } else {
        const searchCodes: { [key: string]: string } = { "delhi": "07", "haryana": "06", "up": "09", "maharashtra": "27", "rajasthan": "08" };
        for (const s in searchCodes) {
            if (finalAddress.toLowerCase().includes(s)) {
                customerState = stateCodes[searchCodes[s]];
                break;
            }
        }
    }

    // 3. DETAILS BOX
    const detailsY = barY + 10;
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.4);
    doc.rect(10, detailsY, pageWidth - 20, 50);
    doc.line(pageWidth / 2, detailsY, pageWidth / 2, detailsY + 50);
    
    doc.setFillColor(240, 248, 255);
    doc.rect(10.2, detailsY + 0.2, (pageWidth / 2) - 10.2, 6, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Customer Detail", (pageWidth / 2) / 2 + 5, detailsY + 4.5, { align: 'center' });

    doc.setFontSize(8);
    let cY = detailsY + 12;
    const row = (l: string, v: string, y: number) => {
        doc.setFont("helvetica", "bold");
        doc.text(l, 12, y);
        doc.setFont("helvetica", "normal");
        const vLines = doc.splitTextToSize(cleanText(v || "-"), 65);
        doc.text(vLines, 30, y);
        return y + (vLines.length * 4);
    };
    cY = row("M/S", finalShopName, cY);
    cY = row("Address", finalAddress, cY);
    cY = row("Phone", finalPhone, cY);
    cY = row("GSTIN", finalGSTIN, cY);
    cY = row("PAN", finalGSTIN.length === 15 ? finalGSTIN.substring(2, 12) : "-", cY);
    cY = row("Supply", customerState, cY);

    const datePart = new Date(p.updatedAt).toISOString().split('T')[0].replace(/-/g, '');
    const entryId = p.paymentId || p.id || "0";
    const numericHash = Math.abs(entryId.split('').reduce((a: any, b: any) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString().substring(0, 4);
    const professionalInvoiceNo = `MS/${datePart}/${numericHash}`;

    let rY = detailsY + 10;
    const info = (l: string, v: string, y: number) => {
        doc.setFont("helvetica", "normal");
        doc.text(l, pageWidth / 2 + 5, y);
        doc.setFont("helvetica", "bold");
        doc.text(v, pageWidth - 15, y, { align: 'right' });
        return y + 8;
    };
    rY = info("Invoice No.", professionalInvoiceNo, rY);
    rY = info("Invoice Date", finalDate, rY);
    rY = info("Due Date", finalDueDate, rY);

    // 4. TAX CALCULATION
    const tableStartY = detailsY + 50;
    const bizAddress = (businessSettings?.address || "").toLowerCase();
    const isSameState = (bizAddress.includes("delhi") && finalAddress.toLowerCase().includes("delhi")) || 
                        (bizAddress.includes("haryana") && finalAddress.toLowerCase().includes("haryana"));

    const taxable = overrides?.received ? parseFloat(overrides.received) : (p.received / 1.18);
    const totalReceived = overrides?.received ? parseFloat(overrides.received) : p.received;
    
    let cgst = 0, sgst = 0, igst = 0;
    if (isSameState) { cgst = taxable * 0.09; sgst = taxable * 0.09; }
    else { igst = taxable * 0.18; }
    const totalTax = cgst + sgst + igst;
    const totalAmount = taxable + totalTax;

    const tableHead = isSameState 
        ? [[{ content: 'Sr.', rowSpan: 2 }, { content: 'Name of Product / Service', rowSpan: 2 }, { content: 'HSN/SAC', rowSpan: 2 }, { content: 'Qty', rowSpan: 2 }, { content: 'Rate', rowSpan: 2 }, { content: 'Taxable Value', rowSpan: 2 }, { content: 'CGST', colSpan: 2 }, { content: 'SGST', colSpan: 2 }, { content: 'Total', rowSpan: 2 }], ['%', 'Amt', '%', 'Amt']]
        : [[{ content: 'Sr.', rowSpan: 2 }, { content: 'Name of Product / Service', rowSpan: 2 }, { content: 'HSN/SAC', rowSpan: 2 }, { content: 'Qty', rowSpan: 2 }, { content: 'Rate', rowSpan: 2 }, { content: 'Taxable Value', rowSpan: 2 }, { content: 'IGST', colSpan: 2 }, { content: 'Total', rowSpan: 2 }], ['%', 'Amount']];

    const tableBody = isSameState
        ? [['1', safeTitle, '9983', '1.00', taxable.toLocaleString(undefined, { minimumFractionDigits: 2 }), taxable.toLocaleString(undefined, { minimumFractionDigits: 2 }), '9.00', cgst.toFixed(2), '9.00', sgst.toFixed(2), totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })]]
        : [['1', safeTitle, '9983', '1.00', taxable.toLocaleString(undefined, { minimumFractionDigits: 2 }), taxable.toLocaleString(undefined, { minimumFractionDigits: 2 }), '18.00', igst.toFixed(2), totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })]];

    autoTable(doc, {
      startY: tableStartY,
      margin: { left: 10, right: 10 },
      head: tableHead as any,
      body: tableBody as any,
      foot: isSameState 
        ? [['', 'Total', '', '1.00', '', taxable.toLocaleString(undefined, { minimumFractionDigits: 2 }), '', cgst.toFixed(2), '', sgst.toFixed(2), totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })]]
        : [['', 'Total', '', '1.00', '', taxable.toLocaleString(undefined, { minimumFractionDigits: 2 }), '', igst.toFixed(2), totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })]],
      styles: { fontSize: 7, cellPadding: 2, lineColor: [59, 130, 246], lineWidth: 0.1, textColor: [0,0,0], font: 'helvetica' },
      headStyles: { fillColor: [240, 248, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.1, lineColor: [59, 130, 246] },
      bodyStyles: { minCellHeight: 85 },
      footStyles: { fillColor: [240, 248, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
      columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 45, fontStyle: 'bold' } },
      theme: 'grid'
    });

    let fY = (doc as any).lastAutoTable.finalY;
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.4);
    doc.rect(10, fY, pageWidth - 20, 35);
    doc.line(pageWidth / 2 + 15, fY, pageWidth / 2 + 15, fY + 35);
    doc.setFont("helvetica", "bold");
    doc.text("Total in words", (pageWidth / 2 + 15) / 2 + 5, fY + 5.5, { align: 'center' });
    doc.line(10, fY + 8, pageWidth / 2 + 15, fY + 8);
    doc.setFontSize(7);
    const wordsText = toWords(Math.round(totalAmount));
    const splitWords = doc.splitTextToSize(wordsText, (pageWidth / 2 + 15) - 15);
    doc.text(splitWords, (pageWidth / 2 + 15) / 2 + 5, fY + 18, { align: 'center' });

    const sX = pageWidth / 2 + 17;
    const vX = pageWidth - 12;
    const sRow = (l: string, v: string, y: number, b = false) => {
        doc.setFont("helvetica", b ? "bold" : "normal");
        doc.text(l, sX, y);
        doc.text(v, vX, y, { align: 'right' });
        doc.line(pageWidth / 2 + 15, y + 2.5, pageWidth - 10, y + 2.5);
    };
    sRow("Taxable Amount", taxable.toLocaleString(undefined, { minimumFractionDigits: 2 }), fY + 6);
    if (isSameState) {
        sRow("Add : CGST (9%)", cgst.toFixed(2), fY + 13);
        sRow("Add : SGST (9%)", sgst.toFixed(2), fY + 20);
    } else {
        sRow("Add : IGST (18%)", igst.toFixed(2), fY + 13);
        sRow("", "", fY + 20);
    }
    sRow("Total Tax", totalTax.toFixed(2), fY + 27);
    
    doc.setFillColor(240, 248, 255);
    doc.rect(pageWidth / 2 + 15.2, fY + 28.5, (pageWidth - (pageWidth / 2 + 15)) - 10.4, 7, 'F');
    doc.setFontSize(9);
    sRow("Total Amount After Tax", `Rs. ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, fY + 34, true);

    if (fY + 85 > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        fY = 20;
    }

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "italic");
    doc.text("(E & O.E.)", pageWidth - 12, fY + 4.5, { align: 'right' });
    doc.line(pageWidth / 2 + 15, fY + 6, pageWidth - 10, fY + 6);

    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.4);
    doc.rect(10, fY + 6, pageWidth - 20, 50);
    doc.line(pageWidth / 2 + 15, fY + 6, pageWidth / 2 + 15, fY + 56);
    
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details", (pageWidth / 2 + 15) / 2 + 5, fY + 10.5, { align: 'center' });
    doc.line(10, fY + 13, pageWidth / 2 + 15, fY + 13);
    const bRow = (l: string, v: string, y: number) => {
        doc.setFont("helvetica", "bold");
        doc.text(l, 12, y); doc.setFont("helvetica", "normal"); doc.text(v, 40, y);
    };
    bRow("Bank Name", businessSettings?.bankName || "Yes Bank", fY + 19);
    bRow("Acc. Name", businessSettings?.accountName || "Magic Scale", fY + 26);
    bRow("Acc. Number", businessSettings?.accountNumber || "102561900002640", fY + 33);
    bRow("IFSC", businessSettings?.ifscCode || "YESB0001025", fY + 40);

    doc.setFont("helvetica", "bold");
    doc.text("Certified that the particulars given above are true and correct.", (pageWidth / 2 + 15) + (pageWidth - (pageWidth / 2 + 15)) / 2, fY + 10.5, { align: 'center' });
    doc.text("For " + (businessSettings?.name || "Magic Scale"), (pageWidth / 2 + 15) + (pageWidth - (pageWidth / 2 + 15)) / 2, fY + 16, { align: 'center' });
    if (businessSettings?.signatureUrl) {
      try { doc.addImage(businessSettings.signatureUrl, 'PNG', pageWidth - 50, fY + 20, 30, 15); } catch (e) {}
    }
    doc.line(pageWidth / 2 + 25, fY + 48, pageWidth - 20, fY + 48);
    doc.text("Authorised Signatory", (pageWidth / 2 + 15) + (pageWidth - (pageWidth / 2 + 15)) / 2, fY + 52, { align: 'center' });

    fY += 56;
    doc.rect(10, fY, pageWidth - 20, 25);
    doc.setFont("helvetica", "bold");
    doc.text("Terms and Conditions", (pageWidth - 20) / 2 + 10, fY + 4.5, { align: 'center' });
    doc.line(10, fY + 6, pageWidth - 10, fY + 6);
    const tLines = doc.splitTextToSize(businessSettings?.terms || "1. Payment is non-refundable.\n2. Balance on completion.", 180);
    doc.setFont("helvetica", "normal"); doc.text(tLines, 12, fY + 11);

    return { doc, invNo: professionalInvoiceNo };
};
