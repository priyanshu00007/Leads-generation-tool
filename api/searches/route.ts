import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface ProjectRow extends RowDataPacket {
  id: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, niche, city, count, resultCount } = await req.json();

    if (!projectId || !niche || !city) {
      return NextResponse.json(
        { error: "projectId, niche, and city are required" },
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

    const id = crypto.randomUUID();
    await db.query<ResultSetHeader>(
      "INSERT INTO searches (id, project_id, query_text, niche, city, count, result_count) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, projectId, `${niche} in ${city}`, niche, city, count || 10, resultCount || 0]
    );

    return NextResponse.json({ search: { id, projectId, niche, city, count, resultCount } }, { status: 201 });
  } catch (error) {
    console.error("Save search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const [searches] = await db.query<RowDataPacket[]>(
      "SELECT * FROM searches WHERE project_id = ? ORDER BY created_at DESC LIMIT 50",
      [projectId]
    );

    return NextResponse.json({ searches });
  } catch (error) {
    console.error("Fetch searches error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
