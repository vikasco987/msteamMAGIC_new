const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const prisma = new PrismaClient();

async function main() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const tasks = await prisma.task.findMany({
    where: {
      createdAt: {
        gte: sixMonthsAgo
      }
    },
    include: {
      notes: true,
      subtasks: true,
    }
  });

  const exportData = tasks.map((task, index) => {
    let customFields = {};
    if (task.customFields) {
        if (typeof task.customFields === 'string') {
            try {
                customFields = JSON.parse(task.customFields);
            } catch (e) {}
        } else {
            customFields = task.customFields;
        }
    }

    return {
      "S. No.": index + 1,
      Title: task.title,
      Status: task.status,
      Tags: Array.isArray(task.tags) ? task.tags.join(", ") : task.tags,
      "Shop Name": customFields?.shopName || task.shopName || "",
      "Outlet Name": customFields?.outletName || task.outletName || "",
      "Customer Name": customFields?.customerName || task.customerName || "",
      Phone: customFields?.phone || task.phone || "",
      Email: customFields?.email || task.email || "",
      Location: customFields?.location || task.location || "",
      "Package Amount": customFields?.packageAmount || task.packageAmount || "",
      "Start Date": customFields?.startDate || task.startDate || "",
      "End Date": customFields?.endDate || task.endDate || "",
      Timeline: customFields?.timeline || task.timeline || "",
      Assigner: task.assignerName || "—",
      Assignee: task.assigneeName || "—",
      "Task Amount": task.amount,
      Received: task.received,
      "Pending Amount": (Number(task.amount) || 0) - (Number(task.received) || 0),
      "Created Date": task.createdAt ? new Date(task.createdAt).toLocaleString() : "",
      "Updated Date": task.updatedAt ? new Date(task.updatedAt).toLocaleString() : "",
      "Subtasks Status": task.subtasks?.map(st => `${st.title}: ${st.isCompleted ? 'Done' : 'Pending'}`).join(" | ") || "",
      "Account Number": customFields?.accountNumber || task.accountNumber || "",
      "IFSC Code": customFields?.ifscCode || task.ifscCode || "",
      "Rest ID": customFields?.restId || task.restId || "",
      "Aadhaar URL": task.aadhaarUrl || "",
      "PAN URL": task.panUrl || "",
      "Selfie URL": task.selfieUrl || "",
      "Cheque URL": task.chequeUrl || "",
      "Menu URLs": Array.isArray(task.menuCardUrls) ? task.menuCardUrls.join(", ") : task.menuCardUrls || "",
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tasks_Report");
  const filePath = '/Users/vikas/Desktop/Tasks_Report_Full.xlsx';
  XLSX.writeFile(wb, filePath);
  console.log('File saved to:', filePath);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
