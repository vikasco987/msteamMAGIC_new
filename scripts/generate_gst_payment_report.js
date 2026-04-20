const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function generateReport() {
  console.log("🚀 Fetching tasks for GST report...");
  
  try {
    const tasks = await prisma.task.findMany({
      select: {
        id: true,
        title: true,
        shopName: true,
        customerName: true,
        amount: true,
        received: true,
        paymentHistory: true,
        createdAt: true
      }
    });

    console.log(`📊 Found ${tasks.length} tasks. Processing payment history...`);

    const reportData = [];

    tasks.forEach(task => {
      const history = Array.isArray(task.paymentHistory) ? task.paymentHistory : [];
      
      if (history.length === 0) {
        // If no history but has total amount, maybe add a summary row or skip
        // For GST, we usually need transaction-wise data
        return;
      }

      history.forEach((entry, index) => {
        // Handle both old and new entry formats if necessary
        // In msteamMAGIC_new, entry has: amount, received, updatedAt, updatedBy, fileUrl, utr
        
        reportData.push({
          "Date": entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString('en-IN') : "N/A",
          "Task ID": task.id,
          "Project Name": task.title,
          "Shop Name": task.shopName || "N/A",
          "Customer Name": task.customerName || "N/A",
          "Total Budget": task.amount || 0,
          "Amount Received": entry.received || 0,
          "UTR / Transaction No.": entry.utr || "N/A",
          "Updated By": entry.updatedBy || "System",
          "Proof URL": entry.fileUrl || "No Proof",
          "Transaction #": index + 1
        });
      });
    });

    if (reportData.length === 0) {
      console.log("⚠️ No payment entries found to export.");
      return;
    }

    // Create Worksheet
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GST_Payment_Report");

    // File path
    const fileName = `GST_Payment_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(process.cwd(), fileName);

    // Write file
    XLSX.writeFile(wb, filePath);

    console.log(`✅ Report generated successfully: ${filePath}`);
    console.log(`📈 Total transactions exported: ${reportData.length}`);

  } catch (error) {
    console.error("❌ Error generating report:", error);
  } finally {
    await prisma.$disconnect();
  }
}

generateReport();
