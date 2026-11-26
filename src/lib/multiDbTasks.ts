import { MongoClient } from "mongodb";

type MongoFilter = Record<string, any>;

// Cached MongoClient instances to avoid reconnecting on every request
let cachedSecondaryClient: MongoClient | null = null;
let cachedThirdClient: MongoClient | null = null;

export async function getSecondaryClient(): Promise<MongoClient | null> {
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

export async function getThirdClient(): Promise<MongoClient | null> {
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
  // Auth & Role-based visibility
  userClerkId?: string;
  userEmail?: string;
  userRole?: string;
  isPrivileged?: boolean;
  teamMemberIds?: string[];
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

function buildMongoFilter(options: ExternalTaskFetchOptions, source: "secondary" | "third" = "secondary"): MongoFilter {
  const filter: MongoFilter = {
    isHidden: { $ne: true },
  };

  // 🔒 RBAC Permission Check:
  // Non-privileged users (e.g. SELLER, USER, etc.) must ONLY see tasks assigned to them or their team (for TL) or created by them!
  if (!options.isPrivileged && (options.userClerkId || options.userEmail)) {
    const userConditions: any[] = [];
    const validIds: string[] = [];
    if (options.userClerkId) validIds.push(options.userClerkId);
    if (options.teamMemberIds && options.teamMemberIds.length > 0) {
      validIds.push(...options.teamMemberIds);
    }

    if (validIds.length > 0) {
      userConditions.push(
        { assigneeId: { $in: validIds } },
        { assigneeIds: { $in: validIds } },
        { createdByClerkId: { $in: validIds } }
      );
    }

    if (options.userEmail) {
      const emailRegex = new RegExp(`^${options.userEmail.trim()}$`, "i");
      userConditions.push(
        { assigneeEmail: emailRegex },
        { createdByEmail: emailRegex }
      );
    }

    if (userConditions.length > 0) {
      if (filter.$and) {
        filter.$and.push({ $or: userConditions });
      } else {
        filter.$and = [{ $or: userConditions }];
      }
    } else {
      // If user is a seller but has no valid identifier, block all tasks to prevent accidental leak
      filter._id = { $exists: false };
    }
  }

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

  // 📅 Date filter: exactly matching buildTaskWhere logic
  if (options.dateFilter) {
    const dates = options.dateFilter.split(',').filter(Boolean);
    const dateConditions: any[] = [];
    const now = new Date();

    dates.forEach(d => {
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch (d) {
        case "today":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "yesterday":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "last_7_days":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "last_15_days":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 14);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "last_30_days":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 29);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "last_60_days":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 59);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "this_month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "last_month":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
        case "this_year":
          startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
      }

      if (startDate && endDate) {
        dateConditions.push({
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        });
      }
    });

    if (dateConditions.length > 0) {
      if (filter.$and) {
        filter.$and.push({ $or: dateConditions });
      } else {
        filter.$and = [{ $or: dateConditions }];
      }
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
        const filter = buildMongoFilter(options, "secondary");
        const docs = await db.collection("Task")
          .find(filter)
          .sort({ createdAt: -1 })
          .limit(100)
          .toArray();

        // 📝 Batch fetch notes for these tasks
        const taskIds = docs.map(d => d._id);
        const notes = await db.collection("Note").find({
          taskId: { $in: taskIds }
        }).toArray();

        const notesMap: Record<string, any[]> = {};
        notes.forEach(n => {
          const tid = n.taskId ? n.taskId.toString() : "";
          if (!notesMap[tid]) notesMap[tid] = [];
          notesMap[tid].push({
            id: n._id.toString(),
            taskId: `ext_sec_${tid}`,
            content: n.content,
            authorName: n.authorName || "Unknown",
            authorEmail: n.authorEmail || "",
            fileUrl: n.fileUrl || null,
            createdAt: n.createdAt,
            updatedAt: n.updatedAt,
          });
        });

        docs.forEach(doc => {
          const rawId = doc._id.toString();
          tasks.push({
            id: `ext_sec_${rawId}`,
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
            notes: notesMap[rawId] || [],
          } as any);
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
        const filter = buildMongoFilter(options, "third");
        const docs = await db.collection("Task")
          .find(filter)
          .sort({ createdAt: -1 })
          .limit(100)
          .toArray();

        // 📝 Batch fetch notes for these tasks
        const taskIds = docs.map(d => d._id);
        const notes = await db.collection("Note").find({
          taskId: { $in: taskIds }
        }).toArray();

        const notesMap: Record<string, any[]> = {};
        notes.forEach(n => {
          const tid = n.taskId ? n.taskId.toString() : "";
          if (!notesMap[tid]) notesMap[tid] = [];
          notesMap[tid].push({
            id: n._id.toString(),
            taskId: `ext_trd_${tid}`,
            content: n.content,
            authorName: n.authorName || "Unknown",
            authorEmail: n.authorEmail || "",
            fileUrl: n.fileUrl || null,
            createdAt: n.createdAt,
            updatedAt: n.updatedAt,
          });
        });

        docs.forEach(doc => {
          const rawId = doc._id.toString();
          tasks.push({
            id: `ext_trd_${rawId}`,
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
            notes: notesMap[rawId] || [],
          } as any);
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
        const baseFilter = buildMongoFilter({ ...options, status: undefined }, "secondary");
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
        const baseFilter = buildMongoFilter({ ...options, status: undefined }, "third");
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

// -------------------------------------------------------------
// 📝 Cross-CRM Notes Support
// -------------------------------------------------------------
export async function fetchExternalTaskNotes(externalTaskId: string): Promise<any[]> {
  const isSecondary = externalTaskId.startsWith("ext_sec_");
  const isThird = externalTaskId.startsWith("ext_trd_");
  if (!isSecondary && !isThird) return [];

  const rawId = externalTaskId.replace(/^ext_(sec|trd)_/, "");
  try {
    const { ObjectId } = await import("mongodb");
    const mongoId = new ObjectId(rawId);

    const client = isSecondary ? await getSecondaryClient() : await getThirdClient();
    if (!client) return [];

    const db = client.db();
    const notes = await db.collection("Note").find({
      $or: [
        { taskId: mongoId },
        { taskId: rawId }
      ]
    }).sort({ createdAt: -1 }).toArray();

    return notes.map(n => ({
      id: n._id.toString(),
      taskId: externalTaskId,
      content: n.content,
      authorName: n.authorName || "Unknown",
      authorEmail: n.authorEmail || "",
      fileUrl: n.fileUrl || null,
      mentions: n.mentions || [],
      reactions: n.reactions || [],
      readBy: n.readBy || [],
      createdAt: n.createdAt || new Date(),
      updatedAt: n.updatedAt || new Date(),
    }));
  } catch (err) {
    console.error(`Error fetching external notes for ${externalTaskId}:`, err);
    return [];
  }
}

export async function createExternalTaskNote(
  externalTaskId: string,
  data: { content: string; authorName?: string; authorEmail?: string; fileUrl?: string }
): Promise<any | null> {
  const isSecondary = externalTaskId.startsWith("ext_sec_");
  const isThird = externalTaskId.startsWith("ext_trd_");
  if (!isSecondary && !isThird) return null;

  const rawId = externalTaskId.replace(/^ext_(sec|trd)_/, "");
  try {
    const { ObjectId } = await import("mongodb");
    const mongoId = new ObjectId(rawId);

    const client = isSecondary ? await getSecondaryClient() : await getThirdClient();
    if (!client) return null;

    const db = client.db();
    const newNote = {
      taskId: mongoId,
      content: data.content,
      authorName: data.authorName || "Unknown",
      authorEmail: data.authorEmail || "",
      fileUrl: data.fileUrl || null,
      mentions: [],
      reactions: [],
      readBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("Note").insertOne(newNote);
    return {
      id: result.insertedId.toString(),
      ...newNote,
      taskId: externalTaskId,
    };
  } catch (err) {
    console.error(`Error creating external note for ${externalTaskId}:`, err);
    return null;
  }
}

// -------------------------------------------------------------
// 🔄 Cross-CRM Task Status & Field Updates
// -------------------------------------------------------------
export async function updateExternalTask(
  externalTaskId: string,
  updates: Record<string, any>
): Promise<boolean> {
  const isSecondary = externalTaskId.startsWith("ext_sec_");
  const isThird = externalTaskId.startsWith("ext_trd_");
  if (!isSecondary && !isThird) return false;

  const rawId = externalTaskId.replace(/^ext_(sec|trd)_/, "");
  try {
    const { ObjectId } = await import("mongodb");
    const mongoId = new ObjectId(rawId);

    const client = isSecondary ? await getSecondaryClient() : await getThirdClient();
    if (!client) return false;

    const db = client.db();
    const updateDoc: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (updates.status) {
      updateDoc.status = updates.status.toLowerCase();
    }
    if (updates.title) updateDoc.title = updates.title;
    if (updates.priority) updateDoc.priority = updates.priority;
    if (updates.notes !== undefined) updateDoc.notes = updates.notes;

    const result = await db.collection("Task").updateOne(
      { _id: mongoId },
      { $set: updateDoc }
    );

    return result.matchedCount > 0;
  } catch (err) {
    console.error(`Error updating external task ${externalTaskId}:`, err);
    return false;
  }
}
