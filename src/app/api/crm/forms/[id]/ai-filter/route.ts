import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: formId } = await context.params;
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { query, columns } = await req.json();

        if (!query || !columns) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCXro2IyzxnET3LFbdWobBR5MLyM41q3wI"; // Fallback to provided key
        if (!apiKey) {
            return NextResponse.json({
                error: "GEMINI_API_KEY is not configured in environment variables. Please add it to your .env file."
            }, { status: 500 });
        }

        const systemPrompt = `You are a helpful AI data analyst integrated into a Next.js/React datagrid CRM. 
Your goal is to convert natural language queries into a JSON object containing a friendly conversational response and an array of filters.

Here are the available columns in the datagrid:
${JSON.stringify(columns, null, 2)}

You must return a valid JSON object matching this schema exactly:
{
  "message": "A friendly, short, natural language response confirming what you understood and did (like: 'Sure, I've filtered the table to show pending tasks assigned to Vikash.')",
  "filters": [
    {
      "columnId": "string (the id of the matched column)",
      "operator": "string (must be one of: contains, equals, starts_with, ends_with, not_equals, is_empty, is_not_empty, eq, gt, lt, gte, lte, between, today, yesterday, before, after, tomorrow, this_week)",
      "value": "string (the value to filter by. For partial text matching, use contains. For numbers, use eq, gt, lt, etc.)"
    }
  ]
}

If no filters can be determined or the query doesn't make sense, return:
{
  "message": "I'm sorry, I couldn't understand which columns or data you're trying to filter. Could you clarify?",
  "filters": []
}

Return ONLY valid JSON. Do NOT wrap in markdown \`\`\`json. Just the raw JSON object.

User Query: "${query}"`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: systemPrompt }]
                }]
            })
        });

        if (!response.ok) {
            console.error("Gemini API Error:", await response.text());
            return NextResponse.json({ error: "Failed to communicate with AI provider" }, { status: 500 });
        }

        const data = await response.json();
        let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "{\"message\": \"Error processing input\", \"filters\": []}";

        // Clean up potential markdown formatting from AI response
        aiResponse = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();

        let parsed = { message: "I couldn't process this request.", filters: [] };
        try {
            parsed = JSON.parse(aiResponse);
        } catch (e) {
            console.error("Failed to parse AI response:", aiResponse);
            return NextResponse.json({ error: "AI returned invalid filter format", raw: aiResponse }, { status: 500 });
        }

        return NextResponse.json({
            message: parsed.message || "Filters applied!",
            filters: Array.isArray(parsed.filters) ? parsed.filters : []
        });
    } catch (error: any) {
        console.error("AI Filter Error:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
