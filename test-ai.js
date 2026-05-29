const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { generateObject } = require('ai');
const { z } = require('zod');
require('dotenv').config();

async function main() {
  try {
    console.log("Key:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
    
    const google = createGoogleGenerativeAI({
      apiKey: "AIzaSyDjkU2_Wr6kEyxyIIG2T-9DgaF9YVj6Tnc",
    });

    // Create a dummy image (1x1 transparent PNG)
    const dummyImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const buffer = Buffer.from(dummyImageBase64, 'base64');

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        test: z.string(),
      }),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is this?' },
            { type: 'image', image: buffer }
          ]
        }
      ],
    });

    console.log("Success:", result.object);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
