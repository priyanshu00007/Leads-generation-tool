import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function POST() {
  try {
    const email = "admin@priyanshu";
    const password = "admin@priyanshu";

    const [existing] = await db.query<RowDataPacket[]>("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      await db.query<ResultSetHeader>("UPDATE users SET role = 'admin' WHERE email = ?", [email]);
      return NextResponse.json({ message: "Admin user already exists. Role set to admin." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const id = crypto.randomUUID();

    await db.query<ResultSetHeader>(
      "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, 'admin')",
      [id, "Admin", email, hashedPassword]
    );

    return NextResponse.json({
      message: "Admin user created successfully",
      credentials: { email: "admin@priyanshu", password: "admin@priyanshu" },
    });
  } catch (error) {
    console.error("Admin seed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
