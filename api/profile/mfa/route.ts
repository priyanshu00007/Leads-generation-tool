import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateMfaSecret, verifyMfaToken, generateQrCode } from "@/lib/mfa";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT totp_secret, totp_enabled FROM users WHERE id = ?",
    [session.user.id]
  );
  const user = rows[0];
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    enabled: !!user.totp_enabled,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, token } = await req.json();

  if (action === "setup") {
    const { secret, otpauth } = await generateMfaSecret();
    const qrCode = await generateQrCode(otpauth);

    await db.query<ResultSetHeader>(
      "UPDATE users SET totp_secret = ? WHERE id = ?",
      [secret, session.user.id]
    );

    return NextResponse.json({ secret, qrCode, otpauth });
  }

  if (action === "enable") {
    if (!token) {
      return NextResponse.json({ error: "Verification code required" }, { status: 400 });
    }

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT totp_secret FROM users WHERE id = ?",
      [session.user.id]
    );
    const user = rows[0];
    if (!user?.totp_secret) {
      return NextResponse.json({ error: "No secret found. Run setup first." }, { status: 400 });
    }

    if (!(await verifyMfaToken(token, user.totp_secret))) {
      return NextResponse.json({ error: "Invalid code. Try again." }, { status: 400 });
    }

    await db.query<ResultSetHeader>(
      "UPDATE users SET totp_enabled = 1 WHERE id = ?",
      [session.user.id]
    );

    return NextResponse.json({ message: "2FA enabled successfully", enabled: true });
  }

  if (action === "disable") {
    if (!token) {
      return NextResponse.json({ error: "Verification code required to disable 2FA" }, { status: 400 });
    }

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT totp_secret FROM users WHERE id = ?",
      [session.user.id]
    );
    const user = rows[0];
    if (!user?.totp_secret || !(await verifyMfaToken(token, user.totp_secret))) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    await db.query<ResultSetHeader>(
      "UPDATE users SET totp_secret = NULL, totp_enabled = 0 WHERE id = ?",
      [session.user.id]
    );

    return NextResponse.json({ message: "2FA disabled", enabled: false });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
