import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface ProjectRow extends RowDataPacket {
  id: string;
  name: string;
  niche: string | null;
  city: string | null;
  updated_at: string;
  lead_count: number;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [projects] = await db.query<ProjectRow[]>(
      `SELECT p.id, p.name, p.niche, p.city, p.updated_at,
        (SELECT COUNT(*) FROM leads WHERE project_id = p.id) AS lead_count
       FROM projects p
       WHERE p.user_id = ?
       ORDER BY p.updated_at DESC`,
      [session.user.id]
    );

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Fetch projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, niche, city } = await req.json();
    const id = crypto.randomUUID();

    await db.query<ResultSetHeader>(
      "INSERT INTO projects (id, user_id, name, niche, city) VALUES (?, ?, ?, ?, ?)",
      [id, session.user.id, name || `Project - ${new Date().toLocaleDateString()}`, niche || null, city || null]
    );

    const project = { id, name: name || `Project - ${new Date().toLocaleDateString()}`, niche, city };
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
