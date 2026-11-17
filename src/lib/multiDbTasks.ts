import { MongoClient } from "mongodb";

type MongoFilter = Record<string, any>;

// Cached MongoClient instances to avoid reconnecting on every request
let cachedSecondaryClient: MongoClient | null = null;
let cachedThirdClient: MongoClient | null = null;

async function getSecondaryClient(): Promise<MongoClient | null> {
  const uri = process.env.SECONDARY_CRM_DATABASE_URL;
  if (!uri) return null;
  if (cachedSecondaryClient) {
    try {
      // Ping check
      await cachedSecondaryClient.db().command({ ping: 1 });
      return cachedSecondaryClient;
    } catch {
      cachedSecondaryClient = null;
    }
  }
  try {
    const client = new MongoClient(uri);
    await client.connect();
    cachedSecondaryClient = client;
    return client;
  } catch (err) {
    console.error("❌ Failed to connect to SECONDARY_CRM_DATABASE_URL:", err);
    return null;
  }
}

async function getThirdClient(): Promise<MongoClient | null> {
  const uri = process.env.THIRD_CRM_DATABASE_URL;
  if (!uri) return null;
  if (cachedThirdClient) {
    try {
      await cachedThirdClient.db().command({ ping: 1 });
      return cachedThirdClient;
    } catch {
      cachedThirdClient = null;
    }
  }
  try {
    const client = new MongoClient(uri);
    await client.connect();
    cachedThirdClient = client;
    return client;
  } catch (err) {
    console.error("❌ Failed to connect to THIRD_CRM_DATABASE_URL:", err);
    return null;
  }
}

export interface ExternalTaskFetchOptions {
  includeSecondary?: boolean;
  includeThird?: boolean;
  status?: string; // todo, inprogress, done
  search?: string;
  category?: string;
  categories?: string[];
  assignees?: string[];
  assigners?: string[];
  dateFilter?: string;
}

export interface NormalizedExternalTask {
  id: string;
  taskCode?: string | null;
  title: string;
  status: string;
  priority?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  assignerName?: string;
  assignerEmail?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  assigneeId?: string;
  assigneeIds?: string[];
  amount?: number;
  received?: number;
  tags?: string[];
  highlightColor?: string;
  isHidden?: boolean;
  customFields?: Record<string, any>;
  phone?: string;
  email?: string;
  shopName?: string;
  location?: string;
  customerName?: string;
  outletName?: string;
  externalSource: "kravy" | "onboarding"; // 'kravy' for Secondary, 'onboarding' for 3rd
  externalSourceLabel: string;
  isExternal?: boolean;
}

function buildMongoFilter(options: ExternalTaskFetchOptions): MongoFilter {
  const filter: MongoFilter = {
    isHidden: { $ne: true },
  };

  // Status mapping: 'todo', 'inprogress', 'done'
  if (options.status) {
    const s = options.status.toLowerCase().trim();
    if (s === "inprogress" || s === "in-progress") {
      filter.status = { $in: ["inprogress", "in-progress"] };
    } else {
      filter.status = s;
    }
  }

  // Search filter matching shopName, title, taskCode, phone, customerName, location, email
  if (options.search && options.search.trim()) {
    const term = options.search.trim();

    // 1. Exact Task Code Search: if user typed something like "T105" or "t105"
    if (/^t\d+$/i.test(term)) {
      const codeRegex = { $regex: `^${term}$`, $options: "i" };
      if (filter.$and) {
        filter.$and.push({ taskCode: codeRegex });
      } else {
        filter.$and = [{ taskCode: codeRegex }];
      }
    } else {
      // 2. General search across multiple fields
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = { $regex: escaped, $options: "i" };

      const searchConditions: any[] = [
        { title: regex },
        { shopName: regex },
        { outletName: regex },
        { customerName: regex },
        { phone: regex },
        { email: regex },
        { location: regex },
        { taskCode: regex },
        { "customFields.shopName": regex },
        { "customFields.outletName": regex },
        { "customFields.phone": regex },
        { "customFields.customerName": regex },
      ];

      if (filter.$and) {
        filter.$and.push({ $or: searchConditions });
      } else {
        filter.$and = [{ $or: searchConditions }];
      }
    }
  }

  // Assigner filter: जिसने बनाया / असाइन किया
  if (options.assigners && options.assigners.length > 0) {
    const assignerRegexes = options.assigners.map(a => new RegExp(`^${a.trim()}$`, "i"));
    const assignerConditions = [
      { assignerName: { $in: assignerRegexes } },
      { createdByName: { $in: assignerRegexes } },
      { "customFields.assignerName": { $in: assignerRegexes } },
    ];
    if (filter.$and) {
      filter.$and.push({ $or: assignerConditions });
    } else {
      filter.$and = [{ $or: assignerConditions }];
    }
  }

  // Assignee filter: जिसे टास्क दिया गया
  if (options.assignees && options.assignees.length > 0) {
    const assigneeRegexes = options.assignees.map(a => new RegExp(`^${a.trim()}$`, "i"));
    const assigneeConditions = [
      { assigneeName: { $in: assigneeRegexes } },
      { "customFields.assigneeName": { $in: assigneeRegexes } },
      { assigneeIds: { $in: options.assignees } }
    ];
    if (filter.$and) {
      filter.$and.push({ $or: assigneeConditions });
    } else {
      filter.$and = [{ $or: assigneeConditions }];
    }
  }

  // Categories filter (activeTab & structured title matching)
  const cats = options.categories || (options.category ? [options.category] : []);
  if (cats.length > 0) {
    const getCategoryConditions = (cat: string): any[] => {
      const c = cat.toLowerCase().trim();
      switch (c) {
        case "zomato":
          return [
            { "customFields.activeTab": { $in: ["zomato", "combo"] } },
            { title: { $regex: "zomato", $options: "i" } }
          ];
        case "swiggy":
          return [
            { "customFields.activeTab": { $in: ["swiggy", "combo"] } },
            { title: { $regex: "swiggy", $options: "i" } }
          ];
        case "ownly":
          return [
            { "customFields.activeTab": "ownly" },
            { title: { $regex: "ownly", $options: "i" } }
          ];
        case "license":
          return [
            { "customFields.activeTab": "license" },
            { title: { $regex: "license|licence|fssai", $options: "i" } }
          ];
        case "photo":
          return [
            { "customFields.activeTab": "photo" },
            { title: { $regex: "photo", $options: "i" } }
          ];
        case "account":
          return [
            { "customFields.activeTab": "account" },
            { title: { $regex: "account", $options: "i" } }
          ];
        case "printer":
          return [
            { "customFields.activeTab": "printer" },
            { title: { $regex: "printer", $options: "i" } }
          ];
        case "printer_software":
          return [
            { "customFields.activeTab": "printer_software" },
            { title: { $regex: "software", $options: "i" } }
          ];
        case "rto_printer":
          return [
            { "customFields.activeTab": "rto_printer" },
            { title: { $regex: "rto", $options: "i" } }
          ];
        case "escalation":
          return [
            { "customFields.activeTab": "escalation" },
            { title: { $regex: "escalat", $options: "i" } }
          ];
        case "toing":
          return [
            { "customFields.activeTab": "toing" },
            { title: { $regex: "toing", $options: "i" } }
          ];
        case "other":
          return [
            { "customFields.activeTab": "other" }
          ];
        default:
          return [
            { "customFields.activeTab": c },
            { title: { $regex: c, $options: "i" } }
          ];
      }
    };

    const allCatConditions = cats.flatMap(cat => getCategoryConditions(cat));
    if (filter.$and) {
      filter.$and.push({ $or: allCatConditions });
    } else {
      filter.$and = [{ $or: allCatConditions }];
    }
  }

  return filter;
}

export async function fetchExternalBoardTasks(
  options: ExternalTaskFetchOptions
): Promise<NormalizedExternalTask[]> {
  const tasks: NormalizedExternalTask[] = [];

  const promises: Promise<void>[] = [];

  // 1. Fetch from Secondary CRM (cluster0) -> Tagged as 'kravy'
  if (options.includeSecondary) {
    promises.push((async () => {
      try {
        const client = await getSecondaryClient();
        if (!client) return;
        const db = client.db();
        const filter = buildMongoFilter(options);
        const docs = await db.collection("Task")
          .find(filter)
          .sort({ createdAt: -1 })
          .limit(100)
          .toArray();

        docs.forEach(doc => {
          tasks.push({
            id: `ext_sec_${doc._id.toString()}`,
            taskCode: doc.taskCode || null,
            title: doc.title || "Untitled Task",
            status: (doc.status || "todo").toLowerCase(),
            priority: doc.priority || "medium",
            createdAt: doc.createdAt || new Date(),
            updatedAt: doc.updatedAt || new Date(),
            assignerName: doc.assignerName || doc.createdByName || "—",
            assignerEmail: doc.assignerEmail || doc.createdByEmail || "",
            assigneeName: doc.assigneeName || "—",
            assigneeEmail: doc.assigneeEmail || "",
            assigneeId: doc.assigneeId,
            assigneeIds: doc.assigneeIds || [],
            amount: doc.amount || 0,
            received: doc.received || 0,
            tags: doc.tags || [],
            highlightColor: doc.highlightColor,
            isHidden: !!doc.isHidden,
            customFields: doc.customFields || {},
            phone: doc.phone || doc.customFields?.phone,
            email: doc.email || doc.customFields?.email,
            shopName: doc.shopName || doc.customFields?.shopName || doc.outletName || doc.customFields?.outletName,
            location: doc.location || doc.customFields?.location,
            customerName: doc.customerName || doc.customFields?.customerName,
            outletName: doc.outletName || doc.customFields?.outletName,
            externalSource: "kravy",
            externalSourceLabel: "KRAVY CRM",
            isExternal: true,
          });
        });
      } catch (err) {
        console.error("Error fetching tasks from Secondary DB:", err);
      }
    })());
  }

  // 2. Fetch from 3rd CRM (billingcrm / mydb) -> Tagged as 'onboarding'
  if (options.includeThird) {
    promises.push((async () => {
      try {
        const client = await getThirdClient();
        if (!client) return;
        const db = client.db();
        const filter = buildMongoFilter(options);
        const docs = await db.collection("Task")
          .find(filter)
          .sort({ createdAt: -1 })
          .limit(100)
          .toArray();

        docs.forEach(doc => {
          tasks.push({
            id: `ext_trd_${doc._id.toString()}`,
            taskCode: doc.taskCode || null,
            title: doc.title || "Untitled Task",
            status: (doc.status || "todo").toLowerCase(),
            priority: doc.priority || "medium",
            createdAt: doc.createdAt || new Date(),
            updatedAt: doc.updatedAt || new Date(),
            assignerName: doc.assignerName || doc.createdByName || "—",
            assignerEmail: doc.assignerEmail || doc.createdByEmail || "",
            assigneeName: doc.assigneeName || "—",
            assigneeEmail: doc.assigneeEmail || "",
            assigneeId: doc.assigneeId,
            assigneeIds: doc.assigneeIds || [],
            amount: doc.amount || 0,
            received: doc.received || 0,
            tags: doc.tags || [],
            highlightColor: doc.highlightColor,
            isHidden: !!doc.isHidden,
            customFields: doc.customFields || {},
            phone: doc.phone || doc.customFields?.phone,
            email: doc.email || doc.customFields?.email,
            shopName: doc.shopName || doc.customFields?.shopName || doc.outletName || doc.customFields?.outletName,
            location: doc.location || doc.customFields?.location,
            customerName: doc.customerName || doc.customFields?.customerName,
            outletName: doc.outletName || doc.customFields?.outletName,
            externalSource: "onboarding",
            externalSourceLabel: "Onboarding CRM",
            isExternal: true,
          });
        });
      } catch (err) {
        console.error("Error fetching tasks from 3rd DB:", err);
      }
    })());
  }

  await Promise.all(promises);
  return tasks;
}

export async function fetchExternalBoardCounts(
  options: ExternalTaskFetchOptions
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {
    todo: 0,
    inprogress: 0,
    done: 0,
  };

  const promises: Promise<void>[] = [];

  // 1. Secondary CRM counts
  if (options.includeSecondary) {
    promises.push((async () => {
      try {
        const client = await getSecondaryClient();
        if (!client) return;
        const db = client.db();
        const baseFilter = buildMongoFilter({ ...options, status: undefined });
        const agg = await db.collection("Task").aggregate([
          { $match: baseFilter },
          { $group: { _id: { $toLower: "$status" }, count: { $sum: 1 } } }
        ]).toArray();

        agg.forEach(g => {
          const s = (g._id || "").toLowerCase();
          if (s === "inprogress" || s === "in-progress") counts.inprogress += g.count;
          else if (s === "todo") counts.todo += g.count;
          else if (s === "done") counts.done += g.count;
        });
      } catch (e) {
        console.error("Error aggregating secondary counts:", e);
      }
    })());
  }

  // 2. 3rd CRM counts
  if (options.includeThird) {
    promises.push((async () => {
      try {
        const client = await getThirdClient();
        if (!client) return;
        const db = client.db();
        const baseFilter = buildMongoFilter({ ...options, status: undefined });
        const agg = await db.collection("Task").aggregate([
          { $match: baseFilter },
          { $group: { _id: { $toLower: "$status" }, count: { $sum: 1 } } }
        ]).toArray();

        agg.forEach(g => {
          const s = (g._id || "").toLowerCase();
          if (s === "inprogress" || s === "in-progress") counts.inprogress += g.count;
          else if (s === "todo") counts.todo += g.count;
          else if (s === "done") counts.done += g.count;
        });
      } catch (e) {
        console.error("Error aggregating 3rd counts:", e);
      }
    })());
  }

  await Promise.all(promises);
  return counts;
}
