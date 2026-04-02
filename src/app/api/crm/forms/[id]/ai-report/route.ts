import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { prisma } from "@/lib/prisma";

const googleProvider = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || "",
});

function renderReportTemplate(data: any) {
    if (!data) return "<div>No data available for report.</div>";

    const metricsHtml = (data.keyMetrics || []).map((m: any) => `
        <div style="flex: 1; min-width: 160px; background: white; padding: 18px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">${m.label}</p>
            <p style="margin: 6px 0 0; font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">${m.value}</p>
            ${m.trend ? `<p style="margin: 6px 0 0; font-size: 11px; font-weight: 700; color: ${m.trend.includes('+') ? '#10b981' : '#f43f5e'}; display: flex; align-items: center; gap: 4px;">
                ${m.trend.includes('+') ? '↑' : '↓'} ${m.trend}
            </p>` : ''}
        </div>
    `).join("");

    const deepInsightsHtml = (data.deepAnalysis || []).map((item: any) => `
        <div style="margin-bottom: 20px; padding: 20px; background: white; border-radius: 16px; border-left: 4px solid #6366f1; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <h4 style="margin: 0 0 8px; font-size: 14px; font-weight: 800; color: #1e293b;">${item.title}</h4>
            <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6;">${item.description}</p>
        </div>
    `).join("");

    const risksHtml = (data.risks || []).map((risk: any) => `
        <div style="padding: 12px 16px; background: #fff1f2; border: 1px solid #ffe4e6; border-radius: 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 18px;">⚠️</span>
            <span style="font-size: 12px; color: #9f1239; font-weight: 700;">${risk}</span>
        </div>
    `).join("");

    const recommendationsHtml = (data.recommendations || []).map((rec: any) => `
        <div style="padding: 12px 16px; background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 18px;">🎯</span>
            <span style="font-size: 12px; color: #166534; font-weight: 700;">${rec}</span>
        </div>
    `).join("");

    return `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.5; background: #f8fafc; padding: 32px; border-radius: 24px;">
            <!-- Header section -->
            <div style="display: flex; justify-between; align-items: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0;">
                <div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -0.04em;">Deep Intelligence Audit</h1>
                    <p style="margin: 8px 0 0; font-size: 14px; font-weight: 600; color: #64748b;">Comprehensive multidimensional analysis of CRM ecosystem data</p>
                </div>
                <div style="margin-left: auto; padding: 8px 16px; background: #0f172a; color: white; border-radius: 12px; font-size: 10px; font-weight: 800; text-transform: uppercase;">
                    Internal Use Only
                </div>
            </div>

            <!-- Executive Summary -->
            <div style="margin-bottom: 40px;">
                <h2 style="font-size: 12px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Executive Briefing</h2>
                <div style="font-size: 16px; color: #334155; line-height: 1.7; font-weight: 500;">
                    ${data.summary}
                </div>
            </div>

            <!-- Key Performance Indicators -->
            <div style="margin-bottom: 40px;">
                <h2 style="font-size: 12px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Core Metrics & Trajectories</h2>
                <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                    ${metricsHtml}
                </div>
            </div>

            <!-- Deep Analysis Grid -->
            <div style="display: grid; grid-template-columns: 3fr 2fr; gap: 32px; margin-bottom: 40px;">
                <div>
                    <h2 style="font-size: 12px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Strategic Patterns Found</h2>
                    ${deepInsightsHtml}
                </div>
                <div>
                    <h2 style="font-size: 12px; font-weight: 800; color: #f43f5e; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Potential Risks</h2>
                    ${risksHtml}
                    
                    <h2 style="font-size: 12px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.1em; margin: 32px 0 16px;">Recommended Actions</h2>
                    ${recommendationsHtml}
                </div>
            </div>

            <!-- Conclusion Card -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; border-radius: 20px; color: white; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                    <div style="width: 12px; h-12px; border-radius: 50%; background: #6366f1;"></div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: 900; letter-spacing: -0.01em;">Analysis Verdict</h3>
                </div>
                <p style="margin: 0; font-size: 14px; opacity: 0.8; line-height: 1.6;">
                    Based on the current data trajectories, the system priority is set to <strong>${data.priority}</strong>. 
                    This analysis suggests focus on <strong>${data.verdictFocus || 'operational optimization'}</strong> over the next business cycle.
                </p>
            </div>
        </div>
    `;
}

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: formId } = await context.params;
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const reports = await prisma.aIAnalysis.findMany({
            where: { formId },
            orderBy: { createdAt: 'desc' },
            select: { id: true, query: true, createdAt: true, htmlReport: true }
        });

        return NextResponse.json(reports);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    console.log(">>> AI DEEP REPORT ENGINE V5 ACTIVATED <<<");
    try {
        const { id: formId } = await context.params;
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { query, columns, rowData, forceRefresh } = await req.json();

        if (!columns || !rowData) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Check Cache
        if (!forceRefresh) {
            const cached = await prisma.aIAnalysis.findFirst({
                where: { formId, query: query || "default" },
                orderBy: { createdAt: 'desc' }
            });
            if (cached) return NextResponse.json({ html: cached.htmlReport, isCached: true });
        }

        // 2. Perform Exhaustive AI Analysis
        const prompt = `You are a Tier-1 Data Scientist and Business Consultant. 
        Perform an analysis of this CRM data based exactly on the requested specific query.
        
        Available Columns Metadata: ${JSON.stringify(columns)}
        Data Snapshot for Analysis: ${JSON.stringify(rowData.slice(0, 200))}
        Specific Request: ${query || "Deep dive analysis of patterns, anomalies, and performance"}

        If the 'Specific Request' asks for a simple, basic, or quick summary, provide a lightweight, easy-to-read overview without overly complex jargon. 
        If it asks for a deep analysis, audit, or dive, provide an exhaustive, multi-dimensional business analysis.

        You must try to identify (scale depth up/down based on the specific request):
        1. General behavioral trends & patterns
        2. Correlations or groupings
        3. Quantifiable performance metrics (Revenue, volume, conversion, etc. if available)
        4. Any risks, empty fields, or anomalies
        5. Actionable next steps
        * CRITICAL: If a basic overview is requested, accurately COUNT baseline numbers from the data (e.g. Total entries, entries today, number of remarks, number of calls/tasks, empty fields, etc.) and highlight them.

        RETURN ONLY A VALID JSON OBJECT IN THIS EXACT STRUCTURE:
        {
          "summary": "Deep executive summary of finding (2-3 paragraphs)",
          "keyMetrics": [
            { "label": "Revenue Impact", "value": "$10k", "trend": "+12%" },
            { "label": "Lead Velocity", "value": "4.2 days", "trend": "-5%" }
          ],
          "deepAnalysis": [
            { "title": "Pattern Recognition", "description": "Describe a hidden pattern found in the data" },
            { "title": "Anomalous Behavior", "description": "Describe an outlier or risk factor" }
          ],
          "risks": ["Risk point 1", "Risk point 2"],
          "recommendations": ["Strategy 1", "Strategy 2"],
          "priority": "High/Critical/Medium/Low",
          "verdictFocus": "Short phrase about the main focus area"
        }`;

        const { text } = await generateText({
            model: googleProvider("gemini-flash-latest"),
            prompt: prompt,
            maxRetries: 0,
        });

        const cleanedJson = (text || "{}").replace(/```json/gi, "").replace(/```/g, "").trim();
        const analysisData = JSON.parse(cleanedJson);
        const html = renderReportTemplate(analysisData);

        // 3. Save Cache
        await prisma.aIAnalysis.create({
            data: {
                formId,
                query: query || "default",
                analysisData: analysisData as any,
                htmlReport: html
            }
        });

        return NextResponse.json({ html, isCached: false });
    } catch (error: any) {
        console.error("AI DEEP REPORT EXCEPTION:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
