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
      model: google('gemini-1.5-flash'),
      schema: z.object({
        customerName: z.string().describe("Customer or Owner's full name. Return empty string if not found."),
        shopName: z.string().describe("Business, shop, or restaurant name. Return empty string if not found."),
        phone: z.string().describe("Contact phone number, only digits. Return empty string if not found."),
        email: z.string().describe("Email address. Return empty string if not found."),
        fullAddress: z.string().describe("Full address line including street and area. Return empty string if not found."),
        city: z.string().describe("City name. Return empty string if not found."),
        state: z.string().describe("State name. Return empty string if not found."),
        pincode: z.string().describe("6-digit postal pincode. Return empty string if not found."),
      }),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the following details from this business card, menu, or document image. If a field is not present, return an empty string.' },
            { type: 'image', image: buffer }
          ]
        }
      ],
    });

    return NextResponse.json(result.object);
  } catch (error) {
    console.error('AI Extraction Error:', error);
    return NextResponse.json({ error: 'Failed to extract details' }, { status: 500 });
  }
}
