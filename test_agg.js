const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const safeFloat = (v) => {
  if (v == null || v === "") return 0;
  const n = parseFloat(String(v));
  return isNaN(n) || !isFinite(n) ? 0 : n;
};

async function test() {
  const startDate = new Date('2026-09-01T00:00:00Z');
  const endDate = new Date('2026-10-01T00:00:00Z');
  
  const filter = {
    createdAt: { gte: startDate, lt: endDate },
    // no user filter for simple test, let's just fetch all for September
  };

  const tasks = await prisma.task.findMany({
    where: filter,
    select: {
      assignerName: true,
      assignerEmail: true,
      createdByName: true,
      createdByEmail: true,
      amount: true,
      received: true,
      customFields: true,
    }
  });

  const assignerMap = {};
  for (const task of tasks) {
    const name = task.assignerName || task.createdByName || "Unknown";
    const email = task.assignerEmail || task.createdByEmail || "";
    const key = email || name;
    if (!assignerMap[key]) {
      assignerMap[key] = {
        name,
        email,
        totalRevenue: 0,
        amountReceived: 0,
        totalSales: 0,
        taskDirectExpense: 0,
      };
    }
    const customFields = task.customFields || {};
    const delivery = safeFloat(customFields.deliveryCharge);
    const costPrice = safeFloat(customFields.costPrice);
    const directExp = delivery + costPrice;

    assignerMap[key].totalRevenue += task.amount || 0;
    assignerMap[key].amountReceived += task.received || 0;
    assignerMap[key].taskDirectExpense += directExp;
    if ((task.amount || 0) > 0) {
      assignerMap[key].totalSales += 1;
    }
  }

  const jsResult = Object.values(assignerMap).sort((a,b) => a.name.localeCompare(b.name));

  // MongoDB Aggregation
  const aggPipeline = [
    {
      $match: {
        createdAt: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $project: {
        aName: { $ifNull: ["$assignerName", ""] },
        cName: { $ifNull: ["$createdByName", ""] },
        aEmail: { $ifNull: ["$assignerEmail", ""] },
        cEmail: { $ifNull: ["$createdByEmail", ""] },
        amount: { $ifNull: ["$amount", 0] },
        received: { $ifNull: ["$received", 0] },
        deliveryCharge: { $convert: { input: "$customFields.deliveryCharge", to: "double", onError: 0, onNull: 0 } },
        costPrice: { $convert: { input: "$customFields.costPrice", to: "double", onError: 0, onNull: 0 } }
      }
    },
    {
      $project: {
        amount: 1, received: 1, deliveryCharge: 1, costPrice: 1,
        name: {
          $cond: {
            if: { $ne: ["$aName", ""] }, then: "$aName",
            else: {
              $cond: { if: { $ne: ["$cName", ""] }, then: "$cName", else: "Unknown" }
            }
          }
        },
        email: {
          $cond: {
            if: { $ne: ["$aEmail", ""] }, then: "$aEmail",
            else: {
              $cond: { if: { $ne: ["$cEmail", ""] }, then: "$cEmail", else: "" }
            }
          }
        }
      }
    },
    {
      $project: {
        amount: 1, received: 1, deliveryCharge: 1, costPrice: 1, name: 1, email: 1,
        key: {
          $cond: { if: { $ne: ["$email", ""] }, then: "$email", else: "$name" }
        }
      }
    },
    {
      $group: {
        _id: "$key",
        name: { $first: "$name" },
        email: { $first: "$email" },
        totalRevenue: { $sum: "$amount" },
        amountReceived: { $sum: "$received" },
        taskDirectExpense: { $sum: { $add: ["$deliveryCharge", "$costPrice"] } },
        totalSales: {
          $sum: { $cond: { if: { $gt: ["$amount", 0] }, then: 1, else: 0 } }
        }
      }
    }
  ];

  const aggData = await prisma.task.aggregateRaw({ pipeline: aggPipeline });
  
  const aggResult = aggData.map(d => ({
    name: d.name,
    email: d.email,
    totalRevenue: d.totalRevenue,
    amountReceived: d.amountReceived,
    totalSales: d.totalSales,
    taskDirectExpense: d.taskDirectExpense
  })).sort((a,b) => a.name.localeCompare(b.name));

  console.log("JS items:", jsResult.length);
  console.log("Agg items:", aggResult.length);

  let match = true;
  for(let i=0; i<jsResult.length; i++) {
    const j = jsResult[i];
    const a = aggResult.find(x => x.name === j.name && x.email === j.email);
    if (!a) {
      console.log("Missing in Agg:", j);
      match = false;
      continue;
    }
    if (Math.abs(j.totalRevenue - a.totalRevenue) > 0.01 ||
        Math.abs(j.amountReceived - a.amountReceived) > 0.01 ||
        Math.abs(j.taskDirectExpense - a.taskDirectExpense) > 0.01 ||
        j.totalSales !== a.totalSales) {
      console.log("Mismatch for", j.name);
      console.log("JS:", j);
      console.log("Agg:", a);
      match = false;
    }
  }

  console.log("MATCH:", match ? "YES" : "NO");
}

test().catch(console.error).finally(() => prisma.$disconnect());
