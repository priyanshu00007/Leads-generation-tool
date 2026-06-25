import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();
    if (!email || !newPassword) {
      return NextResponse.json({ error: "email and newPassword required" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    const [existing] = await db.query<RowDataPacket[]>("SELECT id FROM users WHERE email = ?", [email]);

    if (existing.length === 0) {
      const id = crypto.randomUUID();
      await db.query<ResultSetHeader>(
        "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, 'admin')",
        [id, "Admin", email, hashed]
      );
    } else {
      await db.query<ResultSetHeader>("UPDATE users SET password = ?, role = 'admin' WHERE email = ?", [hashed, email]);
    }

    return NextResponse.json({ message: `Password reset for ${email}` });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
