import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import * as XLSX from "xlsx";

// Use Mongo Driver directly for dynamic collection access
const uri = process.env.DATABASE_URL;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format"); // "json" or "excel"
    const collectionName = searchParams.get("model"); // the actual collection name in DB
    const targetDbName = searchParams.get("db"); // Optional snapshot DB name

    if (!collectionName) {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
    }

    if (!uri) {
        return NextResponse.json({ error: "Database configuration missing" }, { status: 500 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    
    // Switch to target DB if provided, otherwise use default from URI
    const db = targetDbName ? client.db(targetDbName) : client.db();
    
    // Fetch data from the specified collection
    const data = await db.collection(collectionName).find({}).toArray();
    await client.close();

    // Remove MongoDB specific _id object if it exists (for cleaner export)
    const cleanedData = data.map(item => {
        const doc = { ...item };
        if (doc._id) doc._id = doc._id.toString();
        return doc;
    });

    if (format === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(cleanedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=export_${collectionName}_${new Date().toISOString().split('T')[0]}.xlsx`,
        },
      });
    }

    // Default to JSON
    return new NextResponse(JSON.stringify(cleanedData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename=export_${collectionName}_${new Date().toISOString().split('T')[0]}.json`,
      },
    });

  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed", details: error.message }, { status: 500 });
  }
}
