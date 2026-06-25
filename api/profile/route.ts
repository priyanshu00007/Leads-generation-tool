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

    const [[userRows], [projectRows], [leadRows], [auditRows], [searchRows], [outreachRows], leadList, categoriesList, allSearches] =
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
                  l.created_at, l.source, p.name AS project_name
           FROM leads l JOIN projects p ON p.id = l.project_id
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
      ]);

    const user = userRows[0];
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

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
      leads: leadList.map((l: any) => ({
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
        projectName: l.project_name,
        createdAt: l.created_at,
      })),
      categories: categoriesList.map((c: any) => c.category),
      searches: allSearches.map((s: any) => ({
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
