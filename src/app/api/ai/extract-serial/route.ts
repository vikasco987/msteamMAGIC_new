import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        serials: z.array(z.string()).describe("List of all extracted serial numbers or device identifiers from the image. Each serial must be clean, trimmed, without labels like 'S/N:' or 'Serial Number:'."),
      }),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all visible serial numbers, barcodes, QR codes, or unique hardware identifiers from this device label or image. Return them as a clean array of strings.' },
            { type: 'image', image: buffer }
          ]
        }
      ],
    });

    return NextResponse.json(result.object);
  } catch (error) {
    console.error('AI Serial Extraction Error:', error);
    return NextResponse.json({ error: 'Failed to extract serial number from image' }, { status: 500 });
  }
}
