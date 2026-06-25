import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface ProjectRow extends RowDataPacket {
  id: string;
  name: string;
  niche: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

interface LeadRow extends RowDataPacket {
  id: string;
  project_id: string;
  external_id: string | null;
  name: string;
  category: string;
  address: string;
  city: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  lat: number;
  lng: number;
  photos_count: number | null;
  years_in_business: number | null;
  audit_id: string | null;
  page_speed_score: number | null;
  has_website: number | null;
  mobile_friendly: number | null;
  https: number | null;
  has_schema: number | null;
  load_time_ms: number | null;
  gaps: string | null;
  biggest_gap: string | null;
  est_lost_revenue_per_month: number | null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [projects] = await db.query<ProjectRow[]>(
      "SELECT * FROM projects WHERE id = ? AND user_id = ?",
      [id, session.user.id]
    );

    if (projects.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projects[0];

    const [leads] = await db.query<LeadRow[]>(
      `SELECT l.*,
        a.id AS audit_id, a.page_speed_score, a.has_website, a.mobile_friendly,
        a.https, a.has_schema, a.load_time_ms, a.gaps, a.biggest_gap,
        a.est_lost_revenue_per_month, a.ai_insight
       FROM leads l
       LEFT JOIN audits a ON a.lead_id = l.id
       WHERE l.project_id = ?
       ORDER BY l.created_at DESC`,
      [id]
    );

    const [searches] = await db.query<RowDataPacket[]>(
      "SELECT * FROM searches WHERE project_id = ? ORDER BY created_at DESC",
      [id]
    );

    const [outreach] = await db.query<RowDataPacket[]>(
      `SELECT o.*, l.name AS lead_name, l.phone AS lead_phone, l.email AS lead_email
       FROM outreach o
       LEFT JOIN leads l ON l.id = o.lead_id
       WHERE o.project_id = ?
       ORDER BY o.sent_at DESC`,
      [id]
    );

    return NextResponse.json({
      project: {
        ...project,
        leads: leads.map((l) => ({
          id: l.external_id || l.id,
          name: l.name,
          category: l.category,
          address: l.address,
          city: l.city,
          phone: l.phone,
          whatsapp: l.whatsapp,
          email: l.email,
          website: l.website,
          rating: l.rating,
          reviewsCount: l.reviews_count,
          lat: l.lat,
          lng: l.lng,
          photosCount: l.photos_count,
          yearsInBusiness: l.years_in_business,
          audit: l.audit_id ? {
            leadId: l.external_id || l.id,
            pageSpeedScore: l.page_speed_score || 0,
            hasWebsite: !!l.has_website,
            mobileFriendly: !!l.mobile_friendly,
            https: !!l.https,
            hasSchema: !!l.has_schema,
            loadTimeMs: l.load_time_ms || 0,
            gaps: l.gaps ? (() => { try { return JSON.parse(l.gaps); } catch { return [l.gaps]; } })() : [],
            biggestGap: l.biggest_gap || "",
            estLostRevenuePerMonth: l.est_lost_revenue_per_month || 0,
          } : null,
        })),
        searches,
        outreach,
      },
    });
  } catch (error) {
    console.error("Fetch project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [projects] = await db.query<ProjectRow[]>(
      "SELECT id FROM projects WHERE id = ? AND user_id = ?",
      [id, session.user.id]
    );

    if (projects.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await db.query<ResultSetHeader>("DELETE FROM projects WHERE id = ?", [id]);

    return NextResponse.json({ message: "Project deleted" });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
