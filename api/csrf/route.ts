import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/security";
import { cookies } from "next/headers";

export async function GET() {
  const token = generateCsrfToken();
  const cookieStore = await cookies();
  cookieStore.set("csrf-token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
  return NextResponse.json({ csrfToken: token });
}
