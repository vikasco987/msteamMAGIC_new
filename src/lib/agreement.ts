declare module "pdfkit";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export async function generateAgreementPDF(data: {
    clientName: string;
    clientAddress: string;
    startDate: string;
    endDate: string;
    fee: string;
    targetSales: string;
}) {
    const { clientName, clientAddress, startDate, endDate, fee, targetSales } = data;

    // -------------------- FONT PATHS --------------------
    const fontsPath = path.join(process.cwd(), "public/fonts");
    const arialPath = path.join(fontsPath, "Arial.ttf");
    const arialBoldPath = path.join(fontsPath, "Arial-Bold.ttf");

    if (!fs.existsSync(arialPath) || !fs.existsSync(arialBoldPath)) {
        throw new Error("Arial fonts missing in /public/fonts");
    }

    // -------------------- LOGO & ICON PATHS --------------------
    const logoPath = path.join(process.cwd(), "public/logo.png");
    const calendarIcon = path.join(process.cwd(), "src/assets/icons/calendar.png");
    const backgroundPath = path.join(process.cwd(), "public/bg.png");

    const clauseIcons = [
        path.join(process.cwd(), "src/assets/icons/growth.png"),
        path.join(process.cwd(), "src/assets/icons/fee.png"),
        path.join(process.cwd(), "src/assets/icons/term.png"),
        path.join(process.cwd(), "src/assets/icons/scope.png"),
        path.join(process.cwd(), "src/assets/icons/confidentiality.png"),
        path.join(process.cwd(), "src/assets/icons/entire.png"),
    ];

    const logoExists = fs.existsSync(logoPath);
    const calendarExists = fs.existsSync(calendarIcon);
    const backgroundExists = fs.existsSync(backgroundPath);
    const clauseExists = clauseIcons.map(icon => fs.existsSync(icon));

    // -------------------- PDF SETUP --------------------
    const buffers: Buffer[] = [];
    const doc = new PDFDocument({
        margin: 60,
        size: "A4",
        bufferPages: true,
        font: arialPath,
    });

    doc.registerFont("Arial", arialPath);
    doc.registerFont("Arial-Bold", arialBoldPath);

    doc.on("data", (chunk: any) => buffers.push(chunk));
    const finished = new Promise<void>((resolve) => doc.on("end", () => resolve()));

    const today = new Date();
    const agreementDate = today.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // -------------------- HEADER --------------------
    const renderHeader = () => {
        const margin = doc.page.margins.left;
        let logoHeight = 0;

        if (backgroundExists) {
            doc.image(backgroundPath, 0, 0, { width: doc.page.width, height: doc.page.height });
        }

        if (logoExists) {
            logoHeight = 90;
            doc.image(logoPath, margin, 30, { width: 90, height: logoHeight });
        }

        const rightX = doc.page.width - doc.page.margins.right - 200;
        doc.font("Arial-Bold").fontSize(12).fillColor("#0B3D91")
            .text("Magic Scale", rightX, 40, { align: "right", width: 200 });
        doc.font("Arial").fontSize(10).fillColor("black")
            .text("Near Air Force Camp, Rajokari, 110038", rightX, 60, { align: "right" });
        doc.text("+91 8826073117", rightX, 75, { align: "right" });
        doc.fillColor("blue")
            .text("https://magicscale.in", rightX, 90, { align: "right" });

        doc.moveTo(margin, 140).lineTo(doc.page.width - margin, 140).lineWidth(2).stroke("#0B3D91");

        doc.font("Arial-Bold").fontSize(16).fillColor("#0B3D91");
        doc.text(clientName, margin + 40, 110);
        doc.font("Arial").fontSize(10).fillColor("gray")
            .text(`Agreement created on: ${agreementDate}`, 0, 150, { align: "center" });

        doc.y = 180;
    };

    // -------------------- CLAUSES --------------------
    const addClauseWithIcon = (iconPath: string, title: string, content: string, highlight = false) => {
        if (doc.y > doc.page.height - 180) {
            doc.addPage();
            renderHeader();
        }
        doc.moveDown(0.8);

        if (iconPath && fs.existsSync(iconPath)) {
            doc.image(iconPath, doc.page.margins.left, doc.y, { width: 14, height: 14 });
            doc.font("Arial-Bold").fillColor("#0B3D91").fontSize(14)
                .text(`  ${title}`, doc.page.margins.left + 18, doc.y - 2);
        } else {
            doc.font("Arial-Bold").fillColor("#0B3D91").fontSize(14)
                .text(`📌 ${title}`, doc.page.margins.left);
        }

        doc.moveDown(0.2);

        if (highlight) {
            const boxY = doc.y;
            const boxHeight = doc.heightOfString(content, { width: contentWidth - 20 });
            doc.roundedRect(doc.page.margins.left, boxY - 4, contentWidth, boxHeight + 12, 4).fill("#f7f7f7");
            doc.fillColor("black").font("Arial").fontSize(12)
                .text(content, doc.page.margins.left + 10, boxY + 4, { width: contentWidth - 20, align: "justify", lineGap: 3 });
            doc.moveDown(1.2);
        } else {
            doc.fillColor("black").font("Arial").fontSize(12)
                .text(content, { width: contentWidth, align: "justify", lineGap: 3 });
        }
    };

    renderHeader();

    doc.moveDown(1);
    doc.font("Arial-Bold").fontSize(26).fillColor("#0B3D91").text("SERVICE AGREEMENT", { align: "center" });
    doc.moveDown(2);

    // Intro
    doc.font("Arial").fontSize(12).fillColor("black");
    doc.text("This Agreement is made and entered into on this ", doc.page.margins.left, doc.y, { continued: true });
    if (calendarExists) doc.image(calendarIcon, doc.x, doc.y - 3, { width: 12 });
    doc.fillColor("#FF0000").font("Arial-Bold").text(`${startDate}`, { continued: true });
    doc.font("Arial").fillColor("black").text(" To ", { continued: true });
    doc.fillColor("#FF0000").font("Arial-Bold").text(`${endDate}`);
    doc.moveDown(0.5);

    doc.font("Arial-Bold").fillColor("#0B3D91").text("Between:", { underline: true, width: contentWidth });
    doc.moveDown(0.3);

    doc.font("Arial-Bold").fillColor("#0B3D91").text("Magic Scale Restaurant Consultant");
    doc.font("Arial").fillColor("black").text(
        "A Proprietorship having its registered office at Near Air Force Camp, Rajokari, 110038. Represented by Akash Verma as Sales Manager.",
        { indent: 20, lineGap: 2 }
    );
    doc.moveDown(0.5);

    doc.font("Arial-Bold").fillColor("#0B3D91").text(clientName);
    doc.font("Arial").fillColor("black").text(`A Proprietorship having its registered office at ${clientAddress}.`, { indent: 20, lineGap: 2 });
    doc.moveDown(1);

    doc.font("Arial-Bold").fillColor("#0B3D91").fontSize(14).text("WHEREAS:");
    doc.moveDown(0.3);
    doc.font("Arial").fillColor("black").fontSize(12).text(
        `The Client operates a restaurant known as ${clientName}. The Client desires to improve its business performance and has engaged the Consultant to provide consulting services. The Consultant has agreed to provide such services on the terms and conditions set forth herein.`,
        { indent: 20, lineGap: 2 }
    );
    doc.moveDown(0.3);
    doc.font("Arial-Bold").text(
        "NOW, Therefore, in consideration of the mutual covenants and promises contained herein, the parties agree as follows:",
        { indent: 0, lineGap: 2 }
    );
    doc.moveDown(1);

    addClauseWithIcon(clauseExists[0] ? clauseIcons[0] : "", "1. Growth Target:", `The Consultant will assist the Client in achieving a sales target of ${targetSales} in Swiggy and Zomato Marketplace, compared to the previous month's sales figures. ADS budget will be INR 1500 per week. Important: Food quality must be maintained; Consultant is not responsible if complaints are high.`, true);
    addClauseWithIcon(clauseExists[1] ? clauseIcons[1] : "", "2. One Month Account Handling Charges:", `The Client agrees to pay the Consultant a one-month account handling fee of INR ${fee}.`, true);
    addClauseWithIcon(clauseExists[2] ? clauseIcons[2] : "", "3. Term and Termination:", `This Agreement shall be valid for a period commencing on ${startDate} and ending on ${endDate}. Termination by either party requires 15 days written notice.`);
    addClauseWithIcon(clauseExists[3] ? clauseIcons[3] : "", "4. Scope of Services:", `Consultant services include:\n- Menu analysis and recommendations\n- Marketing and promotional strategies\n- Operational efficiency improvements\n- Cost control measures`);
    addClauseWithIcon(clauseExists[4] ? clauseIcons[4] : "", "5. Confidentiality:", `Both parties agree to keep all shared information confidential.`);
    addClauseWithIcon(clauseExists[5] ? clauseIcons[5] : "", "6. Entire Agreement:", `This Agreement constitutes the entire understanding between the parties and supersedes all prior negotiations and agreements.`);

    doc.moveDown(2);
    doc.font("Arial-Bold").text("Magic Scale Restaurant Consultant");
    doc.font("Arial").text("By: Akash Verma, Manager");
    doc.moveDown(2);
    doc.font("Arial-Bold").text(clientName);
    doc.font("Arial").text("By: Authorized Signatory");

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.font("Arial").fontSize(10).fillColor("gray")
            .text(`Page ${i + 1} of ${pages.count}`, doc.page.margins.left, doc.page.height - 50, { align: "center", width: contentWidth });
    }

    doc.end();
    await finished;

    return Buffer.concat(buffers);
}
