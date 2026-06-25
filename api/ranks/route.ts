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

    const { leadId, score, tier, breakdown } = await req.json();
    if (!leadId || score === undefined) {
      return NextResponse.json({ error: "leadId and score are required" }, { status: 400 });
    }

    const [existing] = await db.query<RowDataPacket[]>(
      "SELECT id FROM ranks WHERE lead_id = ?", [leadId]
    );

    if (existing.length > 0) {
      await db.query<ResultSetHeader>(
        "UPDATE ranks SET score = ?, tier = ?, breakdown = ? WHERE lead_id = ?",
        [score, tier, JSON.stringify(breakdown), leadId]
      );
    } else {
      await db.query<ResultSetHeader>(
        "INSERT INTO ranks (id, lead_id, score, tier, breakdown) VALUES (?, ?, ?, ?, ?)",
        [crypto.randomUUID(), leadId, score, tier, JSON.stringify(breakdown)]
      );
    }

    return NextResponse.json({ saved: true });
  } catch (error: any) {
    console.error("Save rank error:", error?.message || error);
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

    let ranks;
    if (projectId) {
      [ranks] = await db.query<RowDataPacket[]>(
        `SELECT r.* FROM ranks r
         JOIN leads l ON l.id = r.lead_id
         WHERE l.project_id = ?
         ORDER BY r.created_at DESC`,
        [projectId]
      );
    } else {
      [ranks] = await db.query<RowDataPacket[]>(
        `SELECT r.* FROM ranks r ORDER BY r.created_at DESC LIMIT 200`
      );
    }

    return NextResponse.json({ ranks });
  } catch (error) {
    console.error("Fetch ranks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
