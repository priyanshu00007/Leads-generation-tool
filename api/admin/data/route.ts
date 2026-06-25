import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [users] = await db.query<RowDataPacket[]>(
      `SELECT u.id, u.name, u.email, u.image, u.role, u.created_at,
              (SELECT COUNT(*) FROM projects WHERE user_id = u.id) AS project_count,
              (SELECT COUNT(*) FROM leads l JOIN projects p ON p.id = l.project_id WHERE p.user_id = u.id) AS lead_count,
              (SELECT COUNT(*) FROM audits a JOIN leads l ON l.id = a.lead_id JOIN projects p ON p.id = l.project_id WHERE p.user_id = u.id) AS audit_count,
              (SELECT COUNT(*) FROM searches s JOIN projects p ON p.id = s.project_id WHERE p.user_id = u.id) AS search_count,
              (SELECT COUNT(*) FROM outreach o JOIN projects p ON p.id = o.project_id WHERE p.user_id = u.id) AS outreach_count
       FROM users u ORDER BY u.created_at DESC`
    );

    const [[counts]] = await db.query<RowDataPacket[]>(
      `SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM accounts) AS total_accounts,
        (SELECT COUNT(*) FROM sessions) AS total_sessions,
        (SELECT COUNT(*) FROM verification_tokens) AS total_verification_tokens,
        (SELECT COUNT(*) FROM projects) AS total_projects,
        (SELECT COUNT(*) FROM leads) AS total_leads,
        (SELECT COUNT(*) FROM audits) AS total_audits,
        (SELECT COUNT(*) FROM searches) AS total_searches,
        (SELECT COUNT(*) FROM outreach) AS total_outreach,
        (SELECT COUNT(*) FROM leads WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS new_leads_7d,
        (SELECT COUNT(*) FROM leads WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS new_leads_30d,
        (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS new_users_7d`
    );

    const [accounts] = await db.query<RowDataPacket[]>(
      "SELECT id, user_id, provider, type, provider_account_id FROM accounts LIMIT 200"
    );

    const [sessions] = await db.query<RowDataPacket[]>(
      "SELECT id, user_id, session_token, expires FROM sessions ORDER BY expires DESC LIMIT 200"
    );

    const [vTokens] = await db.query<RowDataPacket[]>(
      "SELECT identifier, token, expires FROM verification_tokens ORDER BY expires DESC LIMIT 200"
    );

    const [projects] = await db.query<RowDataPacket[]>(
      `SELECT p.id, p.name, p.niche, p.city, p.created_at, u.name AS user_name, u.email AS user_email,
              (SELECT COUNT(*) FROM leads WHERE project_id = p.id) AS lead_count
       FROM projects p JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC LIMIT 200`
    );

    const [leads] = await db.query<RowDataPacket[]>(
      `SELECT l.id, l.name, l.category, l.address, l.city, l.phone, l.whatsapp, l.email,
              l.website, l.rating, l.reviews_count, l.photos_count, l.years_in_business,
              l.created_at, p.name AS project_name, u.name AS user_name,
              (SELECT COUNT(*) FROM outreach o WHERE o.lead_id = l.id) AS outreach_count,
              (SELECT COUNT(*) FROM audits a WHERE a.lead_id = l.id) AS audit_count
       FROM leads l
       JOIN projects p ON p.id = l.project_id
       JOIN users u ON u.id = p.user_id
       ORDER BY l.created_at DESC LIMIT 200`
    );

    const [audits] = await db.query<RowDataPacket[]>(
      `SELECT a.id, a.lead_id, a.page_speed_score, a.has_website, a.mobile_friendly,
              a.https, a.has_schema, a.load_time_ms, a.gaps, a.biggest_gap,
              a.est_lost_revenue_per_month, a.created_at,
              l.name AS lead_name, p.name AS project_name, u.name AS user_name
       FROM audits a
       JOIN leads l ON l.id = a.lead_id
       JOIN projects p ON p.id = l.project_id
       JOIN users u ON u.id = p.user_id
       ORDER BY a.created_at DESC LIMIT 200`
    );

    const [searches] = await db.query<RowDataPacket[]>(
      `SELECT s.id, s.query_text, s.niche, s.city, s.count, s.result_count, s.created_at,
              p.name AS project_name, u.name AS user_name
       FROM searches s
       JOIN projects p ON p.id = s.project_id
       JOIN users u ON u.id = p.user_id
       ORDER BY s.created_at DESC LIMIT 200`
    );

    const [outreach] = await db.query<RowDataPacket[]>(
      `SELECT o.id, o.lead_id, o.channel, o.language, o.tone, o.subject, o.message, o.sent_at,
              l.name AS lead_name, p.name AS project_name, u.name AS user_name
       FROM outreach o
       LEFT JOIN leads l ON l.id = o.lead_id
       JOIN projects p ON p.id = o.project_id
       JOIN users u ON u.id = p.user_id
       ORDER BY o.sent_at DESC LIMIT 200`
    );

    return NextResponse.json({
      counts,
      users,
      accounts,
      sessions,
      verification_tokens: vTokens,
      projects,
      leads: leads.map((l: any) => ({ ...l, rating: Number(Number(l.rating ?? 0).toFixed(1)) })),
      audits: audits.map((a: any) => ({
        ...a,
        gaps: a.gaps ? (() => { try { return JSON.parse(a.gaps); } catch { return [a.gaps]; } })() : [],
      })),
      searches,
      outreach,
    });
  } catch (error: any) {
    console.error("Admin data API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
