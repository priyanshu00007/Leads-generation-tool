import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface ProjectRow extends RowDataPacket {
  id: string;
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
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, leads } = await req.json();

    if (!projectId || !leads?.length) {
      return NextResponse.json(
        { error: "projectId and leads are required" },
        { status: 400 }
      );
    }

    const [projects] = await db.query<ProjectRow[]>(
      "SELECT id FROM projects WHERE id = ? AND user_id = ?",
      [projectId, session.user.id]
    );

    if (projects.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const results = [];
    for (const lead of leads) {
      const leadId = crypto.randomUUID();
      await db.query<ResultSetHeader>(
        `INSERT INTO leads (id, project_id, external_id, name, category, address, city, phone, whatsapp, email, website, rating, reviews_count, lat, lng, photos_count, years_in_business)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), category = VALUES(category), address = VALUES(address),
           city = VALUES(city), phone = VALUES(phone), whatsapp = VALUES(whatsapp),
           email = VALUES(email), website = VALUES(website), rating = VALUES(rating),
           reviews_count = VALUES(reviews_count), lat = VALUES(lat), lng = VALUES(lng),
           photos_count = VALUES(photos_count), years_in_business = VALUES(years_in_business)`,
        [
          leadId, projectId, lead.id || "",
          lead.name, lead.category, lead.address, lead.city,
          lead.phone || null, lead.whatsapp || null, lead.email || null,
          lead.website || null, lead.rating ?? null, lead.reviewsCount ?? null,
          lead.lat ?? 0, lead.lng ?? 0, lead.photosCount ?? null, lead.yearsInBusiness ?? null,
        ]
      );
      results.push(leadId);
    }

    return NextResponse.json({ saved: results.length, leads: results });
  } catch (error: any) {
    console.error("Save leads error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const [projects] = await db.query<ProjectRow[]>(
      "SELECT id FROM projects WHERE id = ? AND user_id = ?",
      [projectId, session.user.id]
    );

    if (projects.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const [leads] = await db.query<LeadRow[]>(
      `SELECT l.*, a.id AS audit_id, a.page_speed_score
       FROM leads l
       LEFT JOIN audits a ON a.lead_id = l.id
       WHERE l.project_id = ?
       ORDER BY l.created_at DESC`,
      [projectId]
    );

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Fetch leads error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
