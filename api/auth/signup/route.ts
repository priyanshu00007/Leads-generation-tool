import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { sanitizeInput } from "@/lib/security";
import { rateLimitCheck } from "@/lib/rate-limit";

interface UserRow extends RowDataPacket { id: string }

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,72}$/;

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  if (password.length > 72) return "Password must be at most 72 characters";
  if (!/(?=.*[a-z])/.test(password)) return "Password must contain a lowercase letter";
  if (!/(?=.*[A-Z])/.test(password)) return "Password must contain an uppercase letter";
  if (!/(?=.*\d)/.test(password)) return "Password must contain a digit";
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) return "Password must contain a special character";
  return null;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") || "unknown";
    const rl = rateLimitCheck(`signup:${ip}`, 3, 3600_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many accounts created from this IP. Try again later." }, { status: 429 });
    }

    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = (email as string).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const passwordError = validatePassword(password as string);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const [existing] = await db.query<UserRow[]>("SELECT id FROM users WHERE email = ?", [cleanEmail]);
    if (existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password as string, 12);
    const id = crypto.randomUUID();
    const cleanName = name ? sanitizeInput((name as string).trim()) : null;

    await db.query<ResultSetHeader>(
      "INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)",
      [id, cleanName, cleanEmail, hashedPassword]
    );

    return NextResponse.json({ message: "Account created successfully", userId: id }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
