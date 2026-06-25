import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { generateAudit } from "@/lib/gemini";
import type { Lead, AuditResult } from "@/lib/types";

async function loadSeedAudits(): Promise<Record<string, AuditResult>> {
  const p = path.join(process.cwd(), "data", "leads-seed.json");
  const raw = await fs.readFile(p, "utf-8");
  const json = JSON.parse(raw);
  return json.audits as Record<string, AuditResult>;
}

export async function POST(req: Request) {
  const { lead } = (await req.json()) as { lead: Lead };

  // Seed has rich pre-written audits for demo — use if id matches
  const seed = await loadSeedAudits();
  if (seed[lead.id]) {
    return NextResponse.json({ audit: seed[lead.id], source: "seed" });
  }

  // Try Gemini-powered audit
  const geminiAudit = await generateAudit(lead);
  if (geminiAudit) {
    return NextResponse.json({ audit: geminiAudit, source: "gemini" });
  }

  // Final fallback: generate a basic audit from available data
  const hasWebsite = !!lead.website;
  const gaps: string[] = [];
  if (!hasWebsite) gaps.push("No website at all");
  if (!lead.whatsapp) gaps.push("No WhatsApp click-to-chat");
  gaps.push("No online booking", "No schema markup", "Weak local SEO");

  const estLostRevenuePerMonth = Math.max(
    20000,
    (lead.reviewsCount ?? 30) * 400 + (hasWebsite ? 0 : 30000),
  );

  const audit: AuditResult = {
    leadId: lead.id,
    pageSpeedScore: hasWebsite ? Math.floor(Math.random() * 40) + 20 : 0,
    hasWebsite,
    mobileFriendly: false,
    https: hasWebsite ? lead.website!.startsWith("https") : false,
    hasSchema: false,
    loadTimeMs: hasWebsite ? Math.floor(Math.random() * 5000) + 2000 : 0,
    gaps,
    biggestGap: hasWebsite
      ? `Outdated site with no booking flow. A modern build with WhatsApp booking converts visitors into customers.`
      : `${lead.reviewsCount ?? 0} reviews, zero web presence. Losing booking-ready customers to businesses that show up on Google search.`,
    estLostRevenuePerMonth,
  };

  return NextResponse.json({ audit, source: "fallback" });
}
