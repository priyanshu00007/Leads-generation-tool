"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Sparkles, Users, Search, Target, FileCheck, Building2, Mail, Calendar,
  ChevronDown, ChevronUp, Loader2, Shield, ArrowRight, Phone, Star, MapPin,
  Globe, MessageSquare, UserCheck, Key, Hash, Clock, ExternalLink, Copy,
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Eye, EyeOff, Lock,
  Database, BarChart3, Code
} from "lucide-react";

type Data = {
  counts: Record<string, number>;
  users: any[];
  accounts: any[];
  sessions: any[];
  verification_tokens: any[];
  projects: any[];
  leads: any[];
  audits: any[];
  searches: any[];
  outreach: any[];
  ranks: any[];
  builds: any[];
};

const SECTIONS: { key: keyof Data; label: string; icon: any; color: string; bg: string; cols: string[] }[] = [
  {
    key: "users", label: "Users", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10",
    cols: ["name", "email", "role", "project_count", "lead_count", "audit_count", "created_at"],
  },
  {
    key: "accounts", label: "Accounts", icon: UserCheck, color: "text-purple-500", bg: "bg-purple-500/10",
    cols: ["user_id", "provider", "type", "provider_account_id", "created_at"],
  },
  {
    key: "sessions", label: "Sessions", icon: Clock, color: "text-cyan-500", bg: "bg-cyan-500/10",
    cols: ["user_id", "session_token", "expires"],
  },
  {
    key: "verification_tokens", label: "Verification Tokens", icon: Key, color: "text-pink-500", bg: "bg-pink-500/10",
    cols: ["identifier", "token", "expires"],
  },
  {
    key: "projects", label: "Projects", icon: Building2, color: "text-indigo-500", bg: "bg-indigo-500/10",
    cols: ["name", "user_name", "niche", "city", "lead_count", "created_at"],
  },
  {
    key: "leads", label: "Leads", icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10",
    cols: ["name", "category", "city", "phone", "email", "website", "rating", "reviews_count", "project_name", "user_name", "created_at"],
  },
  {
    key: "audits", label: "Audits", icon: FileCheck, color: "text-amber-500", bg: "bg-amber-500/10",
    cols: ["lead_name", "page_speed_score", "has_website", "mobile_friendly", "https", "biggest_gap", "est_lost_revenue_per_month", "user_name", "created_at"],
  },
  {
    key: "searches", label: "Searches", icon: Search, color: "text-violet-500", bg: "bg-violet-500/10",
    cols: ["query_text", "niche", "city", "count", "result_count", "project_name", "user_name", "created_at"],
  },
  {
    key: "outreach", label: "Outreach", icon: MessageSquare, color: "text-rose-500", bg: "bg-rose-500/10",
    cols: ["lead_name", "channel", "language", "tone", "subject", "project_name", "user_name", "sent_at"],
  },
  {
    key: "ranks", label: "Ranks", icon: BarChart3, color: "text-violet-500", bg: "bg-violet-500/10",
    cols: ["lead_name", "score", "tier", "project_name", "user_name", "created_at"],
  },
  {
    key: "builds", label: "Builds", icon: Code, color: "text-indigo-500", bg: "bg-indigo-500/10",
    cols: ["lead_name", "platform", "project_name", "user_name", "created_at"],
  },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("__all__");

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/data")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
        return json;
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.push("/auth/login"); return; }
    if (session.user?.role !== "admin") { router.push("/"); return; }
    fetchData();
  }, [session, status, router, fetchData]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return null;
  if (session.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-lg font-semibold">Access Denied</p>
          <p className="text-sm text-muted-foreground">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="flex items-center gap-2 hover:opacity-80">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg">Lead <span className="text-muted-foreground">→</span> Launch</span>
            </button>
            <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-medium">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              <ArrowRight className="h-3.5 w-3.5 mr-1.5 rotate-180" /> Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-display font-semibold">Admin Dashboard</h1>
        </div>

        {/* User Filter */}
        {data && data.users && !expanded && (
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="__all__">All Users</option>
              {data.users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name || u.email} ({u.lead_count} leads)</option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-600">Failed to load admin data</p>
              <p className="text-xs text-red-500/80 mt-1">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="ml-auto shrink-0">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
            </Button>
          </div>
        )}

        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading admin data...</p>
          </div>
        ) : data ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 mb-8">
              {SECTIONS.map(({ key, label, icon: Icon, color, bg }) => {
                const count = (data.counts as any)?.[`total_${key}`] ?? 0;
                const isActive = expanded === key;
                return (
                  <button
                    key={key}
                    onClick={() => setExpanded(isActive ? null : key)}
                    className={`rounded-xl border bg-card/80 backdrop-blur-sm p-3 text-center transition-all cursor-pointer hover:border-primary/30 ${
                      isActive ? "border-primary/50 ring-2 ring-primary/20 shadow-sm" : "border-border"
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center mx-auto mb-1.5`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="text-xl font-display font-bold tabular-nums">{count}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</div>
                  </button>
                );
              })}
            </div>

            {/* Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              <SummaryCard
                label="Total Users"
                value={data.counts?.total_users ?? 0}
                sub={`${data.users?.filter(u => u.role === "admin").length ?? 0} admin`}
                icon={Users}
                color="text-blue-500"
              />
              <SummaryCard
                label="Total Leads"
                value={data.counts?.total_leads ?? 0}
                sub={`${data.leads?.filter(l => l.phone).length ?? 0} with phone`}
                icon={Target}
                color="text-emerald-500"
              />
              <SummaryCard
                label="New Businesses (7d)"
                value={data.counts?.new_leads_7d ?? 0}
                sub={`${data.counts?.new_leads_30d ?? 0} in last 30 days`}
                icon={BarChart3}
                color="text-orange-500"
              />
              <SummaryCard
                label="New Users (7d)"
                value={data.counts?.new_users_7d ?? 0}
                sub="joined this week"
                icon={UserCheck}
                color="text-purple-500"
              />
              <SummaryCard
                label="Total Searches"
                value={data.counts?.total_searches ?? 0}
                sub={`${data.counts?.total_audits ?? 0} audits`}
                icon={Search}
                color="text-violet-500"
              />
              <SummaryCard
                label="Total Outreach"
                value={data.counts?.total_outreach ?? 0}
                sub={`${data.outreach?.filter(o => o.channel === "email").length ?? 0} email`}
                icon={MessageSquare}
                color="text-rose-500"
              />
            </div>

            {/* New Businesses */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-orange-500" /> New Businesses
                  <span className="text-sm font-normal text-muted-foreground">({data.leads?.length ?? 0} total)</span>
                </h2>
                <Button variant="outline" size="sm" onClick={() => setExpanded(expanded === "leads" ? null : "leads")}>
                  <Target className="h-3.5 w-3.5 mr-1" /> View All Leads
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(data.leads ?? []).slice(0, 20).map((lead: any) => {
                  const contacted = (lead.outreach_count ?? 0) > 0;
                  const hasPhone = !!lead.phone;
                  const hasWhatsapp = !!lead.whatsapp;
                  const hasEmail = !!lead.email;
                  const whatsappNum = lead.whatsapp || lead.phone;
                  return (
                    <div key={lead.id} className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-orange-500/30 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{lead.name || "Unnamed"}</p>
                          {lead.category && <p className="text-[11px] text-muted-foreground truncate">{lead.category}</p>}
                        </div>
                        {contacted
                          ? <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Contacted</span>
                          : <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> New</span>
                        }
                      </div>

                      {lead.address && <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                        <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{lead.address}{lead.city ? `, ${lead.city}` : ""}</span>
                      </p>}

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {lead.rating > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500 fill-amber-500" />{Number(lead.rating).toFixed(1)}</span>}
                        {lead.reviews_count > 0 && <span>{Number(lead.reviews_count).toLocaleString()} reviews</span>}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {hasPhone && (
                          <a href={`tel:${lead.phone}`}
                            className="inline-flex items-center gap-1 text-[11px] bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 px-2 py-1 rounded-lg transition-colors">
                            <Phone className="h-3 w-3" /> Call
                          </a>
                        )}
                        {hasWhatsapp && (
                          <a href={`https://wa.me/${whatsappNum?.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] bg-green-500/10 text-green-600 hover:bg-green-500/20 px-2 py-1 rounded-lg transition-colors">
                            <MessageSquare className="h-3 w-3" /> WhatsApp
                          </a>
                        )}
                        {hasEmail && (
                          <a href={`mailto:${lead.email}`}
                            className="inline-flex items-center gap-1 text-[11px] bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 px-2 py-1 rounded-lg transition-colors">
                            <Mail className="h-3 w-3" /> Email
                          </a>
                        )}
                        {lead.website && (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 px-2 py-1 rounded-lg transition-colors">
                            <Globe className="h-3 w-3" /> Visit
                          </a>
                        )}
                      </div>

                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Added {new Date(lead.created_at).toLocaleDateString()}
                        {lead.project_name && <><span className="opacity-30">·</span> {lead.project_name}</>}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User Leads Pipeline */}
            {!expanded && selectedUserId !== "__all__" && (
              <AdminPipelineView
                leads={data.leads?.filter((l: any) => l.user_id === selectedUserId || l.user_name === data.users.find((u: any) => u.id === selectedUserId)?.name) ?? []}
                ranks={data.ranks ?? []}
                builds={data.builds ?? []}
                outreach={data.outreach ?? []}
                audits={data.audits ?? []}
                selectedUser={data.users.find((u: any) => u.id === selectedUserId)}
              />
            )}

            {/* Expanded Section */}
            {expanded && (data as any)[expanded] && (
              <SectionPanel
                section={SECTIONS.find(s => s.key === expanded)!}
                data={(data as any)[expanded]}
                onClose={() => setExpanded(null)}
              />
            )}

            {/* Users Overview Cards */}
            {!expanded && data.users && data.users.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" /> All Users ({data.users.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.users.map((u: any) => (
                    <div key={u.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold">
                            {u.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.name || "Unnamed"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <RoleBadge role={u.role} />
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        <StatMini label="Projects" value={u.project_count} icon={Building2} color="text-indigo-500" />
                        <StatMini label="Leads" value={u.lead_count} icon={Target} color="text-emerald-500" />
                        <StatMini label="Audits" value={u.audit_count} icon={FileCheck} color="text-amber-500" />
                        <StatMini label="Searches" value={u.search_count} icon={Search} color="text-violet-500" />
                        <StatMini label="Outreach" value={u.outreach_count} icon={MessageSquare} color="text-rose-500" />
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Joined {new Date(u.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : !error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Database className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function SummaryCard({ label, value, sub, icon: Icon, color }: { label: string; value: number; sub: string; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/80 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-display font-bold tabular-nums">{value}</div>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

function StatMini({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-1.5 text-center">
      <Icon className={`h-3 w-3 ${color} mx-auto mb-0.5`} />
      <div className="text-xs font-semibold tabular-nums">{value ?? 0}</div>
      <div className="text-[8px] text-muted-foreground leading-tight">{label}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
        <Shield className="h-3 w-3" /> admin
      </span>
    );
  }
  return (
    <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full font-medium">
      user
    </span>
  );
}

function SectionPanel({ section, data, onClose }: { section: typeof SECTIONS[number]; data: any[]; onClose: () => void }) {
  const Icon = section.icon;

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
        <Icon className="h-10 w-10 text-muted-foreground/30 mx-auto" />
        <p className="text-muted-foreground">No {section.label.toLowerCase()} found.</p>
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mb-8">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${section.color}`} />
          <h2 className="text-lg font-display font-semibold">
            {section.label}
            <span className="text-sm font-normal text-muted-foreground ml-2">({data.length})</span>
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <XCircle className="h-3.5 w-3.5 mr-1" /> Close
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-2.5 px-3 font-medium text-muted-foreground w-8">#</th>
              {section.cols.map(col => (
                <th key={col} className="text-left py-2.5 px-3 font-medium text-muted-foreground whitespace-nowrap">
                  {col.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, i: number) => (
              <tr key={row.id || i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="py-2 px-3 text-muted-foreground/50 tabular-nums">{i + 1}</td>
                {section.cols.map(col => (
                  <td key={col} className="py-2 px-3 whitespace-nowrap max-w-[220px] truncate">
                    <CellValue value={row[col]} col={col} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CellValue({ value, col }: { value: any; col: string }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground/40">—</span>;
  }

  if (col === "role") {
    if (value === "admin") return <RoleBadge role="admin" />;
    return <RoleBadge role="user" />;
  }

  if (col === "provider") {
    const styles: Record<string, string> = {
      credentials: "bg-blue-500/10 text-blue-600",
      google: "bg-red-500/10 text-red-600",
    };
    return <Tag text={value} className={styles[value] || "bg-gray-500/10 text-gray-600"} />;
  }

  if (col === "type") {
    return <Tag text={value} className="bg-sky-500/10 text-sky-600" />;
  }

  if (col === "channel") {
    const styles: Record<string, string> = {
      email: "bg-blue-500/10 text-blue-600",
      whatsapp: "bg-green-500/10 text-green-600",
      sms: "bg-purple-500/10 text-purple-600",
    };
    return <Tag text={value} className={styles[value] || "bg-gray-500/10 text-gray-600"} />;
  }

  if (col === "language") {
    return <Tag text={value} className="bg-teal-500/10 text-teal-600" />;
  }

  if (col === "tone") {
    const styles: Record<string, string> = {
      professional: "bg-blue-500/10 text-blue-600",
      friendly: "bg-green-500/10 text-green-600",
      casual: "bg-orange-500/10 text-orange-600",
    };
    return <Tag text={value} className={styles[value] || "bg-gray-500/10 text-gray-600"} />;
  }

  if (["has_website", "mobile_friendly", "https", "has_schema"].includes(col)) {
    return value
      ? <CheckCircle className="h-4 w-4 text-emerald-500" />
      : <XCircle className="h-4 w-4 text-red-400" />;
  }

  if (col === "gaps") {
    const arr = Array.isArray(value) ? value : [value];
    if (arr.length === 0 || (arr.length === 1 && !arr[0])) {
      return <span className="text-muted-foreground/40">—</span>;
    }
    return (
      <span className="flex gap-1 flex-wrap">
        {arr.slice(0, 3).map((g: string, i: number) => (
          <Tag key={i} text={String(g)} className="bg-rose-500/10 text-rose-600" />
        ))}
        {arr.length > 3 && <span className="text-[10px] text-muted-foreground">+{arr.length - 3}</span>}
      </span>
    );
  }

  if (col === "subject" && value) {
    return <span className="truncate block max-w-[200px]" title={value}>{value}</span>;
  }

  if (col === "session_token" || col === "token" || col === "provider_account_id") {
    return (
      <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded" title={value}>
        {String(value).slice(0, 16)}…
      </code>
    );
  }

  if (col === "email" && value?.includes("@")) {
    return <span className="text-primary">{value}</span>;
  }

  if (col === "phone" || col === "whatsapp") {
    return (
      <span className="font-mono text-[11px] flex items-center gap-1">
        <Phone className="h-3 w-3 text-muted-foreground" />
        {value}
      </span>
    );
  }

  if (col === "website" && value) {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer"
        className="text-primary hover:underline inline-flex items-center gap-1 max-w-[180px] truncate">
        {String(value).replace(/^https?:\/\//, "").slice(0, 25)}
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    );
  }

  if (col === "rating") {
    const num = Number(value);
    return (
      <span className="font-mono tabular-nums flex items-center gap-1">
        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
        {num > 0 ? num.toFixed(1) : "—"}
      </span>
    );
  }

  if (col === "reviews_count") {
    return <span className="font-mono tabular-nums">{value ? Number(value).toLocaleString() : "—"}</span>;
  }

  if (col === "page_speed_score") {
    const num = Number(value);
    let color = "text-emerald-500";
    if (num < 50) color = "text-red-500";
    else if (num < 90) color = "text-amber-500";
    return <span className={`font-mono tabular-nums font-semibold ${color}`}>{num}</span>;
  }

  if (col === "est_lost_revenue_per_month") {
    const num = Number(value || 0);
    return <span className="font-mono tabular-nums">₹{num.toLocaleString()}</span>;
  }

  if (col === "load_time_ms") {
    return <span className="font-mono tabular-nums">{value}ms</span>;
  }

  if (col === "created_at" || col === "sent_at" || col === "expires") {
    if (!value) return <span className="text-muted-foreground/40">—</span>;
    return <span className="text-muted-foreground text-[11px]">{new Date(value).toLocaleString()}</span>;
  }

  if (col === "count" || col === "result_count") {
    return <span className="font-mono tabular-nums">{Number(value)}</span>;
  }

  if (typeof value === "boolean") {
    return value
      ? <CheckCircle className="h-4 w-4 text-emerald-500" />
      : <XCircle className="h-4 w-4 text-red-400" />;
  }

  return <span>{String(value)}</span>;
}

function Tag({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${className || "bg-muted text-muted-foreground"}`}>
      {text}
    </span>
  );
}

function AdminPipelineView({ leads, ranks, builds, outreach, audits, selectedUser }: {
  leads: any[]; ranks: any[]; builds: any[]; outreach: any[]; audits: any[]; selectedUser?: any;
}) {
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const ranksMap = new Map(ranks.map((r: any) => [r.lead_id, r]));
  const buildsMap = new Map<string, any[]>();
  for (const b of builds) {
    const arr = buildsMap.get(b.lead_id) || [];
    arr.push(b);
    buildsMap.set(b.lead_id, arr);
  }
  const auditsMap = new Map(audits.map((a: any) => [a.lead_id, a]));
  const outreachMap = new Map(outreach.filter((o: any) => o.lead_id).map((o: any) => [o.lead_id, o]));

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-lg font-display font-semibold flex items-center gap-2">
        <Users className="h-5 w-5 text-blue-500" />
        {selectedUser?.name || selectedUser?.email || "User"} Pipeline
        <span className="text-sm font-normal text-muted-foreground">({leads.length} leads)</span>
      </h2>

      {leads.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Target className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No leads for this user yet.</p>
        </div>
      )}

      {leads.map((lead: any) => {
        const isExpanded = expandedLead === lead.id;
        const rank = ranksMap.get(lead.id);
        const leadBuilds = buildsMap.get(lead.id) || [];
        const audit = auditsMap.get(lead.id);
        const contacted = outreachMap.has(lead.id);

        return (
          <div key={lead.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{lead.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {lead.category} · {lead.city}
                    {lead.project_name && <span> · {lead.project_name}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className={`h-2 w-2 rounded-full ${contacted ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span className={`text-[10px] hidden sm:inline ${contacted ? "text-emerald-600" : "text-amber-600"}`}>
                  {contacted ? "Contacted" : "New"}
                </span>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border p-4 space-y-4">
                {/* Contact Info */}
                <div className="flex flex-wrap gap-2">
                  {lead.phone && <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg"><Phone className="h-3 w-3" /> Call</a>}
                  {(lead.whatsapp || lead.phone) && <a href={`https://wa.me/${(lead.whatsapp || lead.phone || "").replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20 px-2.5 py-1.5 rounded-lg"><MessageSquare className="h-3 w-3" /> WhatsApp</a>}
                  {lead.email && <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 text-xs bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 px-2.5 py-1.5 rounded-lg"><Mail className="h-3 w-3" /> Email</a>}
                  {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 px-2.5 py-1.5 rounded-lg"><Globe className="h-3 w-3" /> Visit</a>}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div><p className="text-[10px] text-muted-foreground">Address</p><p className="text-xs">{lead.address}{lead.city ? `, ${lead.city}` : ""}</p></div>
                  {lead.rating > 0 && <div><p className="text-[10px] text-muted-foreground">Rating</p><p className="text-xs">{Number(lead.rating).toFixed(1)} ★</p></div>}
                  {lead.reviews_count > 0 && <div><p className="text-[10px] text-muted-foreground">Reviews</p><p className="text-xs">{Number(lead.reviews_count).toLocaleString()}</p></div>}
                  <div><p className="text-[10px] text-muted-foreground">Added</p><p className="text-xs">{new Date(lead.created_at).toLocaleDateString()}</p></div>
                </div>

                {/* Audit */}
                {audit && (
                  <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
                    <div className="flex items-center gap-2 mb-2"><FileCheck className="h-4 w-4 text-amber-500" /><span className="text-xs font-medium">Audit</span></div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                      <span>Speed: {audit.page_speed_score ?? "—"}</span>
                      <span>Site: {audit.has_website ? "Yes" : "No"}</span>
                      <span>Mobile: {audit.mobile_friendly ? "Yes" : "No"}</span>
                      <span>HTTPS: {audit.https ? "Yes" : "No"}</span>
                      <span>Schema: {audit.has_schema ? "Yes" : "No"}</span>
                    </div>
                    {audit.biggest_gap && <p className="text-[11px] text-rose-600 mt-1">{audit.biggest_gap}</p>}
                  </div>
                )}

                {/* Rank */}
                {rank && (
                  <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-3">
                    <div className="flex items-center gap-2 mb-2"><BarChart3 className="h-4 w-4 text-violet-500" /><span className="text-xs font-medium">Rank · {rank.score}/100</span><span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600">{rank.tier}</span></div>
                    {rank.breakdown && typeof rank.breakdown === "object" && (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[10px] text-muted-foreground">
                        {Object.entries(rank.breakdown as Record<string, number>).map(([k, v]) => <span key={k} className="capitalize">{k.replace(/([A-Z])/g, " $1")}: {v}</span>)}
                      </div>
                    )}
                  </div>
                )}

                {/* Builds */}
                {leadBuilds.length > 0 && (
                  <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/20 p-3">
                    <div className="flex items-center gap-2 mb-2"><Code className="h-4 w-4 text-indigo-500" /><span className="text-xs font-medium">Builds ({leadBuilds.length})</span></div>
                    <div className="flex flex-wrap gap-1.5">
                      {leadBuilds.map((b: any) => (
                        <span key={b.id} className="text-[10px] bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full">{b.platform}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* User info */}
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <UserCheck className="h-3 w-3" /> {lead.user_name || lead.user_name}
                  {lead.project_name && <><span className="opacity-30">·</span> {lead.project_name}</>}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Button({ children, variant = "outline", size = "sm", className = "", ...props }: {
  children: React.ReactNode;
  variant?: "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground";
  const sizeClass = size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4";
  return (
    <button className={`${base} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
