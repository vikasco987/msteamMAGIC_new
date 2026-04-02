import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { NextRequest } from 'next/server';

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { messages, dataContext } = await req.json();
        console.log("Chat Request received for form:", (await context.params).id);

        const systemPrompt = `You are a helpful and intelligent Vercel AI Chatbot integrated directly into a CRM data matrix.
    
    You have access to the table's structure (columns).
    Columns: ${JSON.stringify(dataContext?.columns || [])}
    
    You can chat with the user freely. If the user wants to filter the table, use the 'applyFilter' tool.
    If the user wants to see a mini report or insights, just type out the insights in markdown format using the 'generateReport' tool or directly if you have enough context.
    Keep your answers concise, professional, and helpful.`;

        const result = streamText({
            model: google('gemini-flash-latest'),
            system: systemPrompt,
            messages,
            maxRetries: 0,
            tools: {
                applyFilter: {
                    description: 'Apply a structured filter to the CRM table based on the user request. Call this if the user says "show me pending tasks" or similar.',
                    inputSchema: z.object({
                        filters: z.array(z.object({
                            columnId: z.string().describe("The exact ID of the column to filter on"),
                            operator: z.enum(['contains', 'equals', 'starts_with', 'ends_with', 'not_equals', 'is_empty', 'is_not_empty', 'eq', 'gt', 'lt', 'gte', 'lte', 'between', 'today', 'yesterday', 'before', 'after', 'tomorrow', 'this_week']),
                            value: z.string().describe("The value to filter")
                        }))
                    }),
                    execute: async ({ filters }: { filters: any[] }) => {
                        return {
                            success: true,
                            filtersApplied: filters,
                            message: "Filters have been applied to the table. Please look at the table to see the result."
                        };
                    }
                },
                generateReport: {
                    description: 'Generate a comprehensive AI report analyzing all tabular data. Call this if the user asks for a "report", "summary", or "full analysis". Pass their specific request as the query if they have one.',
                    inputSchema: z.object({
                        query: z.string().optional().describe("The specific analysis query requested by the user, if any. E.g., 'Risk & Anomalies analysis'")
                    }),
                    execute: async ({ query }: { query?: string }) => {
                        return {
                            success: true,
                            query,
                            message: "Generating a deep intelligence report... Please wait."
                        };
                    }
                }
            }
        });

        return result.toTextStreamResponse();
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
