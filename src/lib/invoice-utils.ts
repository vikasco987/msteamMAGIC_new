import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoicePDF = (p: any, businessSettings: any, overrides?: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text(businessSettings?.name || "Magic Scale", 10, 20);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const companyAddr = doc.splitTextToSize(businessSettings?.address || "Rajokari, New Delhi", 80);
    doc.text(companyAddr, 10, 26);
    doc.text(`GSTIN: ${businessSettings?.gstin || "N/A"}`, 10, 38);
    doc.text(`Email: ${businessSettings?.email || "N/A"}`, 10, 42);

    // Invoice Label
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 220, 220);
    doc.text("INVOICE", pageWidth - 10, 25, { align: 'right' });

    // Payment Info
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    const datePart = new Date(p.updatedAt).toISOString().split('T')[0].replace(/-/g, '');
    const numericHash = Math.abs((p.paymentId || p.id || "0").split('').reduce((a: any, b: any) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString().substring(0, 4);
    const invNo = `MS/${datePart}/${numericHash}`;

    doc.text(`Invoice No:`, pageWidth - 60, 38);
    doc.setFont("helvetica", "normal");
    doc.text(invNo, pageWidth - 10, 38, { align: 'right' });
    
    doc.setFont("helvetica", "bold");
    doc.text(`Date:`, pageWidth - 60, 43);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(p.updatedAt).toLocaleDateString(), pageWidth - 10, 43, { align: 'right' });

    // Client Info
    doc.setDrawColor(240, 240, 240);
    doc.line(10, 50, pageWidth - 10, 50);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", 10, 60);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(p.shopName || p.shop || "Valued Customer", 10, 66);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const clientAddr = doc.splitTextToSize(p.address || p.location || "N/A", 70);
    doc.text(clientAddr, 10, 72);
    doc.text(`GSTIN: ${p.gstin || "N/A"}`, 10, 85);
    doc.text(`Phone: ${p.phone || "N/A"}`, 10, 90);

    // Items Table
    const taxableValue = p.received / 1.18;
    const gstValue = p.received - taxableValue;

    autoTable(doc, {
        startY: 100,
        head: [['Description', 'Amount (Excl. GST)', 'GST (18%)', 'Total']],
        body: [
            [
                p.taskTitle || p.name || 'Services Rendered', 
                `INR ${taxableValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                `INR ${gstValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                `INR ${p.received.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
        columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right', fontStyle: 'bold' }
        }
    });

    let fY = (doc as any).lastAutoTable.cursor.y + 10;
    
    // Total in words or big total
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text(`Total Received: INR ${p.received.toLocaleString()}/-`, pageWidth - 10, fY, { align: 'right' });

    // Bank Details
    fY += 20;
    doc.setDrawColor(200, 200, 200);
    doc.rect(10, fY, pageWidth - 20, 40);
    doc.setFontSize(10);
    doc.text("Bank Details for Transfer:", 12, fY + 7);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Bank Name: ${businessSettings?.bankName || "Yes Bank"}`, 12, fY + 15);
    doc.text(`Acc Name: ${businessSettings?.accountName || "Magic Scale"}`, 12, fY + 22);
    doc.text(`Acc Number: ${businessSettings?.accountNumber || "102561900002640"}`, 12, fY + 29);
    doc.text(`IFSC Code: ${businessSettings?.ifscCode || "YESB0001025"}`, 12, fY + 36);

    // Authorized Signatory
    doc.setFont("helvetica", "bold");
    doc.text("For " + (businessSettings?.name || "Magic Scale"), pageWidth - 10, fY + 7, { align: 'right' });
    if (businessSettings?.signatureUrl) {
        try { doc.addImage(businessSettings.signatureUrl, 'PNG', pageWidth - 50, fY + 10, 30, 15); } catch (e) {}
    }
    doc.text("Authorised Signatory", pageWidth - 10, fY + 36, { align: 'right' });

    return { doc, invNo };
};
