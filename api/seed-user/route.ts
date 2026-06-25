import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const email = "priyanshurathod518@gmail.com";
    const password = "priyanshurathod518@gmail.com";

    const hashed = await bcrypt.hash(password, 12);

    const [existing] = await db.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ?", [email]
    );

    if (existing.length > 0) {
      await db.query<ResultSetHeader>(
        "UPDATE users SET password = ? WHERE email = ?", [hashed, email]
      );
      return NextResponse.json({ message: "Test user password updated. Email: " + email });
    }

    const id = crypto.randomUUID();
    await db.query<ResultSetHeader>(
      "INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)",
      [id, "Priyanshu", email, hashed]
    );

    return NextResponse.json({ message: "Test user created. Email: " + email + ", Password: " + password });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed user" }, { status: 500 });
  }
}
