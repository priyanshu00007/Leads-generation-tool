import { NextResponse } from "next/server";
import { setupDatabase } from "@/lib/db-schema";

export async function POST() {
  try {
    await setupDatabase();
    return NextResponse.json({ message: "Database schema created successfully" });
  } catch (error) {
    console.error("Setup database error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
