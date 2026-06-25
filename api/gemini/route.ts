import { NextResponse } from "next/server";
import {
  generateLeadInsight,
  generateAuditInsight,
  generateSmartOutreach,
  generateCompetitorAnalysis,
} from "@/lib/gemini";
import type { Lead, AuditResult, RankedLead } from "@/lib/types";

export async function POST(req: Request) {
  const { action, lead, audit, ranked, channel, language, tone, customInstructions } = (await req.json()) as {
    action: string;
    lead?: Lead;
    audit?: AuditResult;
    ranked?: RankedLead;
    channel?: "whatsapp" | "email" | "instagram";
    language?: "english" | "hinglish";
    tone?: "warm" | "professional" | "urgent" | "friendly";
    customInstructions?: string;
  };

  try {
    switch (action) {
      case "lead-insight": {
        if (!lead || !audit) return NextResponse.json({ error: "lead and audit required" }, { status: 400 });
        const insight = await generateLeadInsight(lead, audit);
        return NextResponse.json({ insight });
      }
      case "audit-insight": {
        if (!lead || !audit) return NextResponse.json({ error: "lead and audit required" }, { status: 400 });
        const insight = await generateAuditInsight(lead, audit);
        return NextResponse.json({ insight });
      }
      case "smart-outreach": {
        if (!ranked || !channel || !language) return NextResponse.json({ error: "ranked, channel, language required" }, { status: 400 });
        const messages = await generateSmartOutreach(ranked, channel, language, tone, customInstructions);
        return NextResponse.json({ messages });
      }
      case "competitor-analysis": {
        if (!lead) return NextResponse.json({ error: "lead required" }, { status: 400 });
        const competitors = await generateCompetitorAnalysis(lead);
        return NextResponse.json({ competitors });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
