import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadId, projectId, platform, prompt } = await req.json();
    if (!leadId || !projectId || !platform || !prompt) {
      return NextResponse.json({ error: "leadId, projectId, platform, and prompt are required" }, { status: 400 });
    }

    await db.query<ResultSetHeader>(
      `INSERT INTO builds (id, lead_id, project_id, platform, prompt)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE prompt = VALUES(prompt)`,
      [crypto.randomUUID(), leadId, projectId, platform, prompt]
    );

    return NextResponse.json({ saved: true });
  } catch (error: any) {
    console.error("Save build error:", error?.message || error);
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
    const leadId = searchParams.get("leadId");
    const projectId = searchParams.get("projectId");

    let builds;
    if (leadId) {
      [builds] = await db.query<RowDataPacket[]>(
        "SELECT * FROM builds WHERE lead_id = ? ORDER BY created_at DESC LIMIT 20",
        [leadId]
      );
    } else if (projectId) {
      [builds] = await db.query<RowDataPacket[]>(
        "SELECT * FROM builds WHERE project_id = ? ORDER BY created_at DESC LIMIT 200",
        [projectId]
      );
    } else {
      [builds] = await db.query<RowDataPacket[]>(
        "SELECT * FROM builds ORDER BY created_at DESC LIMIT 200"
      );
    }

    return NextResponse.json({ builds });
  } catch (error) {
    console.error("Fetch builds error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
