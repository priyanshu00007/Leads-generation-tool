import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface LeadRow extends RowDataPacket {
  id: string;
  project_id: string;
}

interface AuditRow extends RowDataPacket {
  id: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadId, audit } = await req.json();

    if (!leadId || !audit) {
      return NextResponse.json(
        { error: "leadId and audit data are required" },
        { status: 400 }
      );
    }

    const [leads] = await db.query<LeadRow[]>(
      `SELECT l.id, l.project_id FROM leads l
       JOIN projects p ON p.id = l.project_id
       WHERE l.id = ? AND p.user_id = ?`,
      [leadId, session.user.id]
    );

    if (leads.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const id = crypto.randomUUID();
    await db.query<ResultSetHeader>(
      `INSERT INTO audits (id, lead_id, page_speed_score, has_website, mobile_friendly, https, has_schema, load_time_ms, gaps, biggest_gap, est_lost_revenue_per_month, ai_insight)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         page_speed_score = VALUES(page_speed_score), has_website = VALUES(has_website),
         mobile_friendly = VALUES(mobile_friendly), https = VALUES(https),
         has_schema = VALUES(has_schema), load_time_ms = VALUES(load_time_ms),
         gaps = VALUES(gaps), biggest_gap = VALUES(biggest_gap),
         est_lost_revenue_per_month = VALUES(est_lost_revenue_per_month),
         ai_insight = VALUES(ai_insight)`,
      [
        id, leadId,
        audit.pageSpeedScore || 0,
        audit.hasWebsite ? 1 : 0,
        audit.mobileFriendly ? 1 : 0,
        audit.https ? 1 : 0,
        audit.hasSchema ? 1 : 0,
        audit.loadTimeMs || 0,
        JSON.stringify(audit.gaps || []),
        audit.biggestGap || "",
        audit.estLostRevenuePerMonth || 0,
        audit.aiInsight ? JSON.stringify(audit.aiInsight) : null,
      ]
    );

    return NextResponse.json({ audit: { id, leadId, ...audit } });
  } catch (error) {
    console.error("Save audit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { audits } = await req.json();

    if (!audits?.length) {
      return NextResponse.json({ error: "audits array is required" }, { status: 400 });
    }

    let saved = 0;
    for (const item of audits) {
      const [leads] = await db.query<LeadRow[]>(
        `SELECT l.id FROM leads l
         JOIN projects p ON p.id = l.project_id
         WHERE l.id = ? AND p.user_id = ?`,
        [item.leadId, session.user.id]
      );

      if (leads.length === 0) continue;

      const id = crypto.randomUUID();
      await db.query<ResultSetHeader>(
        `INSERT INTO audits (id, lead_id, page_speed_score, has_website, mobile_friendly, https, has_schema, load_time_ms, gaps, biggest_gap, est_lost_revenue_per_month)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           page_speed_score = VALUES(page_speed_score), gaps = VALUES(gaps),
           biggest_gap = VALUES(biggest_gap), est_lost_revenue_per_month = VALUES(est_lost_revenue_per_month)`,
        [
          id, item.leadId,
          item.audit.pageSpeedScore || 0,
          item.audit.hasWebsite ? 1 : 0,
          item.audit.mobileFriendly ? 1 : 0,
          item.audit.https ? 1 : 0,
          item.audit.hasSchema ? 1 : 0,
          item.audit.loadTimeMs || 0,
          JSON.stringify(item.audit.gaps || []),
          item.audit.biggestGap || "",
          item.audit.estLostRevenuePerMonth || 0,
        ]
      );
      saved++;
    }

    return NextResponse.json({ saved });
  } catch (error) {
    console.error("Batch save audits error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
