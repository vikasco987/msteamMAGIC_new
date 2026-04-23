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
      try { doc.addImage(businessSettings.logo, 'PNG', 10, 10, 30, 15); } catch (e) {}
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16); // Reduced from 20 to prevent overlap
    doc.setTextColor(0, 0, 0);
    doc.text(businessSettings?.name || "Magic Scale Restaurant", 42, 15);
    doc.setFontSize(14);
    doc.text("Consultant", 42, 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const addr = doc.splitTextToSize(businessSettings?.address || "Rajokari, New Delhi - 110038", 60);
    doc.text(addr, 42, 27);
    
    // Right Side Info - Moved further right and adjusted
    const rightX = pageWidth - 10;
    const infoLabelX = pageWidth - 60;
    const infoColonX = pageWidth - 48;
    const infoValueX = pageWidth - 45;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const labels = ["Name", "Phone", "Email", "Website"];
    labels.forEach((l, i) => {
        doc.text(l, infoLabelX, 15 + (i * 5));
        doc.text(":", infoColonX, 15 + (i * 5));
    });

    doc.setFont("helvetica", "normal");
    doc.text("Akash Verma", infoValueX, 15);
    doc.text(businessSettings?.phone || "8826073117", infoValueX, 20);
    doc.text(businessSettings?.email || "Support@magicscale.in", infoValueX, 25);
    doc.setFontSize(7); // Website can be long
    doc.text("https://magicscale.in/", infoValueX, 30);

    // 2. TAX INVOICE BAR
    const barY = 42;
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
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text("ORIGINAL FOR RECIPIENT", pageWidth - 12, barY + 6.5, { align: 'right' });

    // Client Info
    const finalShopName = overrides?.shopName || p.shopName || p.customerName || p.shop || "-";
    const finalAddress = overrides?.address || p.address || p.location || "-";
    const finalPhone = overrides?.phone || p.phone || "-";
    const finalGSTIN = overrides?.gstin || p.gstin || "-";
    const finalDate = overrides?.date ? new Date(overrides.date).toLocaleDateString() : new Date(p.updatedAt).toLocaleDateString();
    
    const stateCodes: { [key: string]: string } = {
        "07": "Delhi (07)", "06": "Haryana (06)", "09": "Uttar Pradesh (09)", "27": "Maharashtra (27)", "08": "Rajasthan (08)", "33": "Tamil Nadu (33)"
    };
    let customerState = "Delhi (07)";
    if (finalGSTIN && finalGSTIN.length >= 2) {
        const code = finalGSTIN.substring(0, 2);
        if (stateCodes[code]) customerState = stateCodes[code];
    }

    // 3. DETAILS BOX
    const detailsY = barY + 10;
    doc.setDrawColor(59, 130, 246);
    doc.rect(10, detailsY, pageWidth - 20, 40); // Reduced height from 50 to 40
    doc.line(pageWidth / 2, detailsY, pageWidth / 2, detailsY + 40);
    
    doc.setFillColor(240, 248, 255);
    doc.rect(10.2, detailsY + 0.2, (pageWidth / 2) - 10.2, 6, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Customer Detail", (pageWidth / 2) / 2 + 5, detailsY + 4.5, { align: 'center' });

    let cY = detailsY + 10;
    const row = (l: string, v: string, y: number) => {
        doc.setFont("helvetica", "bold");
        doc.text(l, 12, y);
        doc.setFont("helvetica", "normal");
        const vLines = doc.splitTextToSize(cleanText(v || "-"), 60);
        doc.text(vLines, 30, y);
        return y + (vLines.length * 4);
    };
    cY = row("M/S", finalShopName, cY);
    cY = row("Address", finalAddress, cY);
    cY = row("Phone", finalPhone, cY);
    cY = row("GSTIN", finalGSTIN, cY);

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
        return y + 7;
    };
    rY = info("Invoice No.", professionalInvoiceNo, rY);
    rY = info("Invoice Date", finalDate, rY);
    rY = info("Supply State", customerState, rY);

    // 4. TAX CALCULATION
    const tableStartY = detailsY + 40;
    const bizAddress = (businessSettings?.address || "").toLowerCase();
    const isSameState = (bizAddress.includes("delhi") && finalAddress.toLowerCase().includes("delhi")) || 
                        (bizAddress.includes("haryana") && finalAddress.toLowerCase().includes("haryana"));

    const totalReceived = overrides?.received ? parseFloat(overrides.received) : p.received;
    const taxable = totalReceived / 1.18;
    let cgst = 0, sgst = 0, igst = 0;
    if (isSameState) { cgst = taxable * 0.09; sgst = taxable * 0.09; }
    else { igst = taxable * 0.18; }
    const totalTax = cgst + sgst + igst;
    const totalAmount = taxable + totalTax;

    const tableHead = isSameState 
        ? [[{ content: 'Sr.', rowSpan: 2 }, { content: 'Name of Product / Service', rowSpan: 2 }, { content: 'HSN', rowSpan: 2 }, { content: 'Qty', rowSpan: 2 }, { content: 'Rate', rowSpan: 2 }, { content: 'Taxable', rowSpan: 2 }, { content: 'CGST', colSpan: 2 }, { content: 'SGST', colSpan: 2 }, { content: 'Total', rowSpan: 2 }], ['%', 'Amt', '%', 'Amt']]
        : [[{ content: 'Sr.', rowSpan: 2 }, { content: 'Name of Product / Service', rowSpan: 2 }, { content: 'HSN', rowSpan: 2 }, { content: 'Qty', rowSpan: 2 }, { content: 'Rate', rowSpan: 2 }, { content: 'Taxable', rowSpan: 2 }, { content: 'IGST', colSpan: 2 }, { content: 'Total', rowSpan: 2 }], ['%', 'Amount']];

    const tableBody = isSameState
        ? [['1', safeTitle, '9983', '1.00', taxable.toFixed(2), taxable.toFixed(2), '9.00', cgst.toFixed(2), '9.00', sgst.toFixed(2), totalAmount.toFixed(2)]]
        : [['1', safeTitle, '9983', '1.00', taxable.toFixed(2), taxable.toFixed(2), '18.00', igst.toFixed(2), totalAmount.toFixed(2)]];

    autoTable(doc, {
      startY: tableStartY,
      margin: { left: 10, right: 10 },
      head: tableHead as any,
      body: tableBody as any,
      styles: { fontSize: 7, cellPadding: 2, lineColor: [59, 130, 246], lineWidth: 0.1, textColor: [0,0,0] },
      headStyles: { fillColor: [240, 248, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
      bodyStyles: { minCellHeight: 60 }, // Reduced from 85 to save space
      theme: 'grid'
    });

    let currentY = (doc as any).lastAutoTable.finalY;
    
    // 5. SUMMARY BOX
    doc.setDrawColor(59, 130, 246);
    doc.rect(10, currentY, pageWidth - 20, 30);
    doc.line(pageWidth / 2 + 15, currentY, pageWidth / 2 + 15, currentY + 30);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("Total in words", (pageWidth / 2 + 15) / 2 + 5, currentY + 5, { align: 'center' });
    doc.line(10, currentY + 7, pageWidth / 2 + 15, currentY + 7);
    
    const wordsText = toWords(Math.round(totalAmount));
    const splitWords = doc.splitTextToSize(wordsText, (pageWidth / 2 + 15) - 15);
    doc.setFont("helvetica", "normal");
    doc.text(splitWords, (pageWidth / 2 + 15) / 2 + 5, currentY + 15, { align: 'center' });

    const sRow = (l: string, v: string, y: number, b = false) => {
        doc.setFont("helvetica", b ? "bold" : "normal");
        doc.text(l, pageWidth / 2 + 17, y);
        doc.text(v, pageWidth - 12, y, { align: 'right' });
        doc.line(pageWidth / 2 + 15, y + 2, pageWidth - 10, y + 2);
    };
    
    sRow("Taxable Amount", taxable.toFixed(2), currentY + 5);
    if (isSameState) {
        sRow("CGST + SGST (18%)", totalTax.toFixed(2), currentY + 12);
    } else {
        sRow("IGST (18%)", totalTax.toFixed(2), currentY + 12);
    }
    
    doc.setFillColor(240, 248, 255);
    doc.rect(pageWidth / 2 + 15.2, currentY + 21, (pageWidth - (pageWidth / 2 + 15)) - 10.4, 8, 'F');
    doc.setFontSize(9);
    sRow("Total (After Tax)", `Rs. ${totalAmount.toFixed(2)}`, currentY + 27, true);

    currentY += 35;

    // Check for page split - much tighter now
    if (currentY + 50 > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        currentY = 15;
    }

    // 6. BANK & SIGNATORY BOX
    doc.setDrawColor(59, 130, 246);
    doc.rect(10, currentY, pageWidth - 20, 45);
    doc.line(pageWidth / 2 + 15, currentY, pageWidth / 2 + 15, currentY + 45);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Bank Details", (pageWidth / 2 + 15) / 2 + 5, currentY + 5, { align: 'center' });
    doc.line(10, currentY + 7, pageWidth / 2 + 15, currentY + 7);
    
    const bRow = (l: string, v: string, y: number) => {
        doc.setFont("helvetica", "bold");
        doc.text(l, 12, y); doc.setFont("helvetica", "normal"); doc.text(v, 40, y);
    };
    bRow("Bank Name", businessSettings?.bankName || "Yes Bank", currentY + 13);
    bRow("Acc. Name", businessSettings?.accountName || "Magic Scale", currentY + 19);
    bRow("Acc. Number", businessSettings?.accountNumber || "102561900002640", currentY + 25);
    bRow("IFSC", businessSettings?.ifscCode || "YESB0001025", currentY + 31);

    const signX = (pageWidth / 2 + 15) + (pageWidth - (pageWidth / 2 + 15)) / 2;
    doc.setFont("helvetica", "bold");
    doc.text("For " + (businessSettings?.name || "Magic Scale"), signX, currentY + 5, { align: 'center' });
    
    if (businessSettings?.signatureUrl) {
      try { doc.addImage(businessSettings.signatureUrl, 'PNG', signX - 15, currentY + 8, 30, 12); } catch (e) {}
    }
    
    doc.line(pageWidth / 2 + 25, currentY + 38, pageWidth - 20, currentY + 38);
    doc.text("Authorised Signatory", signX, currentY + 42, { align: 'center' });

    currentY += 50;
    
    // 7. TERMS BOX
    doc.rect(10, currentY, pageWidth - 20, 20);
    doc.setFont("helvetica", "bold");
    doc.text("Terms and Conditions", pageWidth / 2, currentY + 4, { align: 'center' });
    doc.line(10, currentY + 6, pageWidth - 10, currentY + 6);
    const tLines = doc.splitTextToSize(businessSettings?.terms || "1. Payment is non-refundable. 2. Balance on completion.", 180);
    doc.setFont("helvetica", "normal"); 
    doc.setFontSize(7);
    doc.text(tLines, 12, currentY + 11);

    return { doc, invNo: professionalInvoiceNo };
};
