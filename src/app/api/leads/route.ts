// // src/app/api/leads/route.ts
// import { NextResponse } from 'next/server';
// import { v2 as cloudinary } from 'cloudinary';
// import * as XLSX from 'xlsx';
// import fs from 'fs/promises';
// import path from 'path';
// import { connectToDB } from './lib/mongodb';
// import Lead from '@/models/Lead';
// import { IncomingForm } from 'formidable';

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
//   api_key: process.env.CLOUDINARY_API_KEY!,
//   api_secret: process.env.CLOUDINARY_API_SECRET!
// });

// export const config = {
//   api: {
//     bodyParser: false
//   }
// };

// export async function POST(req: Request) {
//   try {
//     // Parse incoming form data
//     const form = new IncomingForm({ keepExtensions: true });
//     const formData: any = await new Promise((resolve, reject) => {
//       form.parse(req as any, (err, fields, files) => {
//         if (err) reject(err);
//         else resolve({ fields, files });
//       });
//     });

//     const file = formData.files.file[0];
//     const filePath = file.filepath || file.path;

//     // 1️⃣ Upload to Cloudinary
//     const uploadRes = await cloudinary.uploader.upload(filePath, {
//       resource_type: 'raw',
//       folder: 'leads'
//     });

//     // 2️⃣ Parse Excel to JSON
//     const workbook = XLSX.readFile(filePath);
//     const sheetName = workbook.SheetNames[0];
//     const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     // 3️⃣ Store in MongoDB
//     await connectToDB();
//     const savedLeads = await Lead.insertMany(
//       data.map((lead) => ({
//         name: lead.Name || '',
//         phone: lead.Phone || '',
//         email: lead.Email || '',
//         status: 'New',
//         notes: '',
//         fileUrl: uploadRes.secure_url
//       }))
//     );

//     // Remove temp file
//     await fs.unlink(filePath);

//     return NextResponse.json({ success: true, leads: savedLeads });
//   } catch (error) {
//     console.error('Upload error:', error);
//     return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
//   }
// }

// export async function GET() {
//   try {
//     await connectToDB();
//     const leads = await Lead.find().sort({ createdAt: -1 });
//     return NextResponse.json({ success: true, leads });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ success: false }, { status: 500 });
//   }
// }
