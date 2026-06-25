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

    const { projectId, leadId, channel, language, tone, subject, message } = await req.json();

    if (!projectId || !channel || !message) {
      return NextResponse.json(
        { error: "projectId, channel, and message are required" },
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
      "INSERT INTO outreach (id, project_id, lead_id, channel, language, tone, subject, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, projectId, leadId || null, channel, language || "english", tone || "professional", subject || null, message]
    );

    return NextResponse.json({ outreach: { id, projectId, leadId, channel, language, tone, subject, message } }, { status: 201 });
  } catch (error) {
    console.error("Save outreach error:", error);
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

    const [outreach] = await db.query<RowDataPacket[]>(
      `SELECT o.*, l.name AS lead_name, l.phone AS lead_phone, l.email AS lead_email
       FROM outreach o
       LEFT JOIN leads l ON l.id = o.lead_id
       WHERE o.project_id = ?
       ORDER BY o.sent_at DESC`,
      [projectId]
    );

    return NextResponse.json({ outreach });
  } catch (error) {
    console.error("Fetch outreach error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
