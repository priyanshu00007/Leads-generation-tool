import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [[userRows], [projectRows], [leadRows], [auditRows], [searchRows], [outreachRows], [userCountRows], [newLeads7d], [newLeads30d], [newUsers7d], [recentUsers], [recentProjects], [topCategories], [leadTrend], [outreachTrend]] = await Promise.all([
      db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM users"),
      db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM projects"),
      db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM leads"),
      db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM audits"),
      db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM searches"),
      db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM outreach"),
      db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM users"),
      db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM leads WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"),
      db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM leads WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"),
      db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"),
      db.query<RowDataPacket[]>("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10"),
      db.query<RowDataPacket[]>("SELECT p.id, p.name, u.email AS user_email, p.created_at FROM projects p JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC LIMIT 10"),
      db.query<RowDataPacket[]>("SELECT category, COUNT(*) AS count FROM leads WHERE category IS NOT NULL AND category != '' GROUP BY category ORDER BY count DESC LIMIT 10"),
      db.query<RowDataPacket[]>("SELECT DATE(created_at) AS date, COUNT(*) AS count FROM leads GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30"),
      db.query<RowDataPacket[]>("SELECT DATE(sent_at) AS date, COUNT(*) AS count FROM outreach GROUP BY DATE(sent_at) ORDER BY date DESC LIMIT 30"),
    ]);

    const totalUsers = Number(userCountRows[0]?.count || 0);
    const totalProjects = Number(projectRows[0]?.count || 0);
    const totalLeads = Number(leadRows[0]?.count || 0);
    const totalAudits = Number(auditRows[0]?.count || 0);
    const totalSearches = Number(searchRows[0]?.count || 0);
    const totalOutreach = Number(outreachRows[0]?.count || 0);

    const newLeads7dCount = Number(newLeads7d[0]?.count || 0);
    const newLeads30dCount = Number(newLeads30d[0]?.count || 0);
    const newUsers7dCount = Number(newUsers7d[0]?.count || 0);

    return NextResponse.json({
      stats: {
        users: totalUsers,
        projects: totalProjects,
        leads: totalLeads,
        audits: totalAudits,
        searches: totalSearches,
        outreach: totalOutreach,
        newLeads7d: newLeads7dCount,
        newLeads30d: newLeads30dCount,
        newUsers7d: newUsers7dCount,
      },
      recentUsers: recentUsers.map((u: any) => ({
        id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.created_at,
      })),
      recentProjects: recentProjects.map((p: any) => ({
        id: p.id, name: p.name, userEmail: p.user_email, createdAt: p.created_at,
      })),
      topCategories: topCategories.map((c: any) => ({
        category: c.category, count: Number(c.count),
      })),
      leadTrend: leadTrend.map((d: any) => ({
        date: d.date, count: Number(d.count),
      })),
      outreachTrend: outreachTrend.map((d: any) => ({
        date: d.date, count: Number(d.count),
      })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
