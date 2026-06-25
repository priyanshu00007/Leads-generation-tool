import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const categoryFilter = searchParams.get("category");

    const [[userRows], [projectRows], [leadRows], [auditRows], [searchRows], [outreachRows], leadList, categoriesList, allSearches, allRanks, allBuilds] =
      await Promise.all([
        db.query<RowDataPacket[]>("SELECT id, name, email, image, created_at, updated_at FROM users WHERE id = ?", [userId]),
        db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM projects WHERE user_id = ?", [userId]),
        db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM leads l JOIN projects p ON p.id = l.project_id WHERE p.user_id = ?", [userId]),
        db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM audits a JOIN leads l ON l.id = a.lead_id JOIN projects p ON p.id = l.project_id WHERE p.user_id = ?", [userId]),
        db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM searches s JOIN projects p ON p.id = s.project_id WHERE p.user_id = ?", [userId]),
        db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM outreach o JOIN projects p ON p.id = o.project_id WHERE p.user_id = ?", [userId]),
        db.query<RowDataPacket[]>(
          `SELECT l.id, l.external_id, l.name, l.category, l.address, l.city, l.phone, l.whatsapp, l.email,
                  l.website, l.rating, l.reviews_count, l.lat, l.lng, l.photos_count, l.years_in_business,
                  l.created_at, l.source, l.project_id, p.name AS project_name,
                  a.id AS audit_id, a.page_speed_score AS audit_page_speed, a.has_website AS audit_has_website,
                  a.mobile_friendly AS audit_mobile, a.https AS audit_https, a.has_schema AS audit_schema,
                  a.load_time_ms AS audit_load_time, a.gaps AS audit_gaps, a.biggest_gap AS audit_biggest_gap,
                  a.est_lost_revenue_per_month AS audit_lost_revenue,
                  r.id AS rank_id, r.score AS rank_score, r.tier AS rank_tier, r.breakdown AS rank_breakdown
           FROM leads l
           JOIN projects p ON p.id = l.project_id
           LEFT JOIN audits a ON a.lead_id = l.id
           LEFT JOIN ranks r ON r.lead_id = l.id
           WHERE p.user_id = ? ${categoryFilter ? "AND l.category = ?" : ""}
           ORDER BY l.created_at DESC LIMIT 500`,
          categoryFilter ? [userId, categoryFilter] : [userId]
        ),
        db.query<RowDataPacket[]>(
          "SELECT DISTINCT l.category FROM leads l JOIN projects p ON p.id = l.project_id WHERE p.user_id = ? AND l.category IS NOT NULL AND l.category != '' ORDER BY l.category",
          [userId]
        ),
        db.query<RowDataPacket[]>(
          `SELECT s.id, s.query, s.city, s.niche, s.source, s.leads_found, s.created_at, p.name AS project_name
           FROM searches s JOIN projects p ON p.id = s.project_id
           WHERE p.user_id = ?
           ORDER BY s.created_at DESC LIMIT 100`,
          [userId]
        ),
        db.query<RowDataPacket[]>(
          `SELECT r.* FROM ranks r
           JOIN leads l ON l.id = r.lead_id
           JOIN projects p ON p.id = l.project_id
           WHERE p.user_id = ?
           ORDER BY r.created_at DESC`,
          [userId]
        ),
        db.query<RowDataPacket[]>(
          `SELECT b.* FROM builds b
           JOIN leads l ON l.id = b.lead_id
           JOIN projects p ON p.id = l.project_id
           WHERE p.user_id = ?
           ORDER BY b.created_at DESC`,
          [userId]
        ),
      ]);

    const user = userRows[0];
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const rankRows = allRanks as RowDataPacket[];
    const buildRows = allBuilds as RowDataPacket[];
    const ranksMap = new Map(rankRows.map((r: any) => [r.lead_id, r]));
    const buildsByLead = new Map<string, any[]>();
    for (const b of buildRows) {
      const arr = buildsByLead.get((b as any).lead_id) || [];
      arr.push(b);
      buildsByLead.set((b as any).lead_id, arr);
    }

    return NextResponse.json({
      user: {
        id: user.id, name: user.name, email: user.email,
        image: user.image, createdAt: user.created_at, updatedAt: user.updated_at,
      },
      stats: {
        projects: Number(projectRows[0]?.count || 0),
        leads: Number(leadRows[0]?.count || 0),
        audits: Number(auditRows[0]?.count || 0),
        searches: Number(searchRows[0]?.count || 0),
        outreach: Number(outreachRows[0]?.count || 0),
      },
      leads: (leadList as RowDataPacket[]).map((l: any) => {
        const rank = ranksMap.get(l.id);
        return {
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
          source: l.source,
          projectId: l.project_id,
          projectName: l.project_name,
          createdAt: l.created_at,
          audit: l.audit_id ? {
            id: l.audit_id,
            pageSpeedScore: l.audit_page_speed,
            hasWebsite: !!l.audit_has_website,
            mobileFriendly: !!l.audit_mobile,
            https: !!l.audit_https,
            hasSchema: !!l.audit_schema,
            loadTimeMs: l.audit_load_time,
            gaps: l.audit_gaps ? (() => { try { return JSON.parse(l.audit_gaps); } catch { return [l.audit_gaps]; } })() : [],
            biggestGap: l.audit_biggest_gap,
            estLostRevenuePerMonth: Number(l.audit_lost_revenue || 0),
          } : null,
          rank: rank ? {
            id: rank.id,
            score: rank.score,
            tier: rank.tier,
            breakdown: rank.breakdown ? (() => { try { return JSON.parse(rank.breakdown); } catch { return null; } })() : null,
          } : null,
          builds: buildsByLead.get(l.id)?.map((b: any) => ({
            id: b.id,
            platform: b.platform,
            prompt: b.prompt,
            createdAt: b.created_at,
          })) || [],
        };
      }),
      categories: (categoriesList as RowDataPacket[]).map((c: any) => c.category),
      searches: (allSearches as RowDataPacket[]).map((s: any) => ({
        id: s.id,
        query: s.query,
        city: s.city,
        niche: s.niche,
        source: s.source,
        leadsFound: s.leads_found,
        projectName: s.project_name,
        createdAt: s.created_at,
      })),
    });
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
