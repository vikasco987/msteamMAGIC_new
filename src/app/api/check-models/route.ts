import { NextResponse } from "next/server";

export async function GET() {
    const apiKey = "AIzaSyCXro2IyzxnET3LFbdWobBR5MLyM41q3wI";
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const res = await fetch(url);
        const json = await res.json();
        return NextResponse.json(json);
    } catch (err: any) {
        return NextResponse.json({ error: err.message });
    }
}
