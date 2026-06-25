import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function GET() {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({
      ok: false,
      error: "GEMINI_API_KEY not set in .env.local",
      help: "Get one free at https://aistudio.google.com/apikey",
    });
  }

  try {
    const res = await fetch(`${BASE_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Return exactly: {"status":"ok","model":"GEMINI_MODEL","message":"Gemini API is working!"}' }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 256,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ ok: false, status: res.status, error: err });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());

    return NextResponse.json({
      ok: true,
      model: GEMINI_MODEL,
      response: parsed,
      usage: data.usageMetadata,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message });
  }
}
