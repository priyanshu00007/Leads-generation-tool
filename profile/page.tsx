"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sparkles, User, Mail, Calendar, Globe, Search, Target, FileCheck, MessageSquare, ArrowRight, Loader2, Shield, Clock, Building2, Star, Phone, MapPin, Smartphone, Key, Check, X, Copy, BarChart3, Code, CheckCircle, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as api from "@/lib/api";

type LeadPipeline = {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  rating: number | null;
  reviewsCount: number | null;
  projectId: string;
  projectName: string;
  createdAt: string;
  audit: {
    id: string;
    pageSpeedScore: number;
    hasWebsite: boolean;
    mobileFriendly: boolean;
    https: boolean;
    hasSchema: boolean;
    loadTimeMs: number;
    gaps: string[];
    biggestGap: string;
    estLostRevenuePerMonth: number;
  } | null;
  rank: {
    id: string;
    score: number;
    tier: string;
    breakdown: Record<string, number> | null;
  } | null;
  builds: Array<{
    id: string;
    platform: string;
    prompt: string;
    createdAt: string;
  }>;
};

type ProfileData = {
  user: { id: string; name: string; email: string; image: string | null; createdAt: string; updatedAt: string };
  stats: { projects: number; leads: number; audits: number; searches: number; outreach: number };
  leads: LeadPipeline[];
  categories: string[];
  searches: Array<any>;
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    api.getProfile().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [session]);

  if (!session) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = data?.stats;
  const total = stats ? Object.values(stats).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <span className="font-display text-lg">Lead <span className="text-muted-foreground">→</span> Launch</span>
          </button>
          <Button variant="outline" size="sm" onClick={() => router.push("/")}>
            <ArrowRight className="h-3.5 w-3.5 mr-1.5 rotate-180" /> Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile Header */}
        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6 sm:p-8 shadow-xl mb-6">
          <div className="flex items-start gap-5 flex-col sm:flex-row">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {session.user?.image ? (
                <img src={session.user.image} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-display font-semibold truncate">{data?.user.name || "User"}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {data?.user.email}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {data?.user.createdAt ? new Date(data.user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "..."}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full">
              <Shield className="h-3.5 w-3.5" />
              <span className="font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {stats && Object.entries(stats).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-border bg-card p-4 text-center hover:border-primary/30 transition-colors">
              <div className="flex justify-center mb-2 text-muted-foreground">
                {key === "projects" && <Building2 className="h-5 w-5" />}
                {key === "leads" && <Target className="h-5 w-5" />}
                {key === "audits" && <FileCheck className="h-5 w-5" />}
                {key === "searches" && <Search className="h-5 w-5" />}
                {key === "outreach" && <MessageSquare className="h-5 w-5" />}
              </div>
              <div className="text-2xl font-display font-bold tabular-nums">{value}</div>
              <div className="text-[11px] text-muted-foreground capitalize mt-0.5">{key}</div>
            </div>
          ))}
        </div>

        {/* Pipeline Leads */}
        {data?.leads && data.leads.length > 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> My Leads Pipeline
              <span className="text-sm font-normal text-muted-foreground">({data.leads.length} total)</span>
            </h2>

            {data.leads.map((lead) => {
              const isExpanded = expandedLead === lead.id;
              const hasAudit = !!lead.audit;
              const hasRank = !!lead.rank;
              const hasBuild = lead.builds && lead.builds.length > 0;

              return (
                <div key={lead.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  {/* Lead Header */}
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
                          {lead.projectName && <span> · {lead.projectName}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Pipeline stage indicators */}
                      <StageDot done={true} label="Scrape" />
                      <StageDot done={hasAudit} label="Audit" />
                      <StageDot done={hasRank} label="Rank" />
                      <StageDot done={hasBuild} label="Build" />
                      <StageDot done={false} label="Reach" />

                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded Pipeline Detail */}
                  {isExpanded && (
                    <div className="border-t border-border divide-y divide-border">
                      {/* 01 · Scrape */}
                      <PipelineSection num="01" title="Scrape" icon={Search} color="text-blue-500" bg="bg-blue-500/5" done={true}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                          <Detail label="Name" value={lead.name} />
                          <Detail label="Category" value={lead.category} />
                          <Detail label="City" value={lead.city} />
                          <Detail label="Address" value={lead.address} />
                          {lead.phone && <Detail label="Phone" value={lead.phone} />}
                          {lead.whatsapp && <Detail label="WhatsApp" value={lead.whatsapp} />}
                          {lead.email && <Detail label="Email" value={lead.email} />}
                          {lead.website && <Detail label="Website" value={lead.website} link />}
                          {lead.rating != null && <Detail label="Rating" value={`${Number(lead.rating).toFixed(1)} ★`} />}
                          {lead.reviewsCount != null && <Detail label="Reviews" value={Number(lead.reviewsCount).toLocaleString()} />}
                          <Detail label="Added" value={new Date(lead.createdAt).toLocaleDateString()} />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg transition-colors">
                              <Phone className="h-3 w-3" /> Call
                            </a>
                          )}
                          {(lead.whatsapp || lead.phone) && (
                            <a href={`https://wa.me/${(lead.whatsapp || lead.phone || "").replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20 px-2.5 py-1.5 rounded-lg transition-colors">
                              <MessageSquare className="h-3 w-3" /> WhatsApp
                            </a>
                          )}
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 text-xs bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 px-2.5 py-1.5 rounded-lg transition-colors">
                              <Mail className="h-3 w-3" /> Email
                            </a>
                          )}
                          {lead.website && (
                            <a href={lead.website} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 px-2.5 py-1.5 rounded-lg transition-colors">
                              <Globe className="h-3 w-3" /> Visit Site
                            </a>
                          )}
                        </div>
                      </PipelineSection>

                      {/* 02 · Audit */}
                      <PipelineSection num="02" title="Audit" icon={FileCheck} color="text-amber-500" bg="bg-amber-500/5" done={hasAudit}>
                        {hasAudit ? (
                          <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <Detail label="PageSpeed" value={String(lead.audit!.pageSpeedScore ?? "—")} />
                              <Detail label="Has Website" value={lead.audit!.hasWebsite ? "Yes" : "No"} />
                              <Detail label="Mobile Friendly" value={lead.audit!.mobileFriendly ? "Yes" : "No"} />
                              <Detail label="HTTPS" value={lead.audit!.https ? "Yes" : "No"} />
                              <Detail label="Schema Markup" value={lead.audit!.hasSchema ? "Yes" : "No"} />
                              <Detail label="Load Time" value={lead.audit!.loadTimeMs ? `${lead.audit!.loadTimeMs}ms` : "—"} />
                              <Detail label="Est. Lost Rev./mo" value={lead.audit!.estLostRevenuePerMonth ? `₹${Number(lead.audit!.estLostRevenuePerMonth).toLocaleString("en-IN")}` : "—"} />
                            </div>
                            {lead.audit!.biggestGap && (
                              <div className="mt-3 p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                                <p className="text-xs font-medium text-rose-600 mb-1">Biggest Gap</p>
                                <p className="text-xs text-muted-foreground">{lead.audit!.biggestGap}</p>
                              </div>
                            )}
                            {lead.audit!.gaps && lead.audit!.gaps.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {lead.audit!.gaps.slice(0, 5).map((g: string, i: number) => (
                                  <span key={i} className="text-[10px] bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full">{g}</span>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">No audit data yet. Run Phase 2 to audit this lead's website.</p>
                        )}
                      </PipelineSection>

                      {/* 03 · Rank */}
                      <PipelineSection num="03" title="Rank" icon={BarChart3} color="text-violet-500" bg="bg-violet-500/5" done={hasRank}>
                        {hasRank ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <div className="text-3xl font-display font-bold">{lead.rank!.score}<span className="text-sm font-normal text-muted-foreground">/100</span></div>
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                lead.rank!.tier === "Hot Lead" ? "bg-emerald-500/10 text-emerald-600" :
                                lead.rank!.tier === "Warm Lead" ? "bg-blue-500/10 text-blue-600" :
                                lead.rank!.tier === "Qualified" ? "bg-amber-500/10 text-amber-600" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {lead.rank!.tier}
                              </span>
                            </div>
                            {lead.rank!.breakdown && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {Object.entries(lead.rank!.breakdown).map(([k, v]) => (
                                  <div key={k} className="rounded-lg bg-muted/30 p-2">
                                    <div className="text-[10px] text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</div>
                                    <div className="text-sm font-semibold tabular-nums">{v}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No ranking data yet. Run Phase 3 to rank this lead.</p>
                        )}
                      </PipelineSection>

                      {/* 04 · Build */}
                      <PipelineSection num="04" title="Build" icon={Code} color="text-indigo-500" bg="bg-indigo-500/5" done={hasBuild}>
                        {hasBuild ? (
                          <div className="space-y-3">
                            {lead.builds.map((b) => (
                              <details key={b.id} className="rounded-lg border border-border bg-muted/20">
                                <summary className="flex items-center justify-between p-3 cursor-pointer text-sm font-medium hover:bg-muted/30 rounded-lg">
                                  <span className="flex items-center gap-2">
                                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                                    {b.platform}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</span>
                                </summary>
                                <div className="border-t border-border p-3">
                                  <pre className="text-[11px] font-mono whitespace-pre-wrap max-h-60 overflow-y-auto text-muted-foreground">{b.prompt}</pre>
                                  <button
                                    onClick={() => { navigator.clipboard.writeText(b.prompt); toast.success("Prompt copied"); }}
                                    className="mt-2 text-xs text-primary hover:underline inline-flex items-center gap-1"
                                  >
                                    <Copy className="h-3 w-3" /> Copy
                                  </button>
                                </div>
                              </details>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No build prompts yet. Run Phase 4 to generate a website.</p>
                        )}
                      </PipelineSection>

                      {/* 05 · Outreach */}
                      <PipelineSection num="05" title="Outreach" icon={MessageSquare} color="text-rose-500" bg="bg-rose-500/5" done={false}>
                        <div className="flex items-center gap-3">
                          <a
                            href={`/api/outreach?leadId=${lead.id}`}
                            className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-2 rounded-lg transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Draft Outreach
                          </a>
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 text-xs bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 px-3 py-2 rounded-lg transition-colors">
                              <Phone className="h-3.5 w-3.5" /> Call
                            </a>
                          )}
                        </div>
                      </PipelineSection>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {data?.leads && data.leads.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-12 text-center mb-6">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No leads yet. Create a project and scrape some leads!</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/")}>
              <Target className="h-3.5 w-3.5 mr-1.5" /> Start Scraping
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function StageDot({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`h-2 w-2 rounded-full ${done ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
      <span className={`text-[9px] hidden sm:inline ${done ? "text-emerald-600 font-medium" : "text-muted-foreground/50"}`}>{label}</span>
    </div>
  );
}

function PipelineSection({ num, title, icon: Icon, color, bg, done, children }: {
  num: string; title: string; icon: any; color: string; bg: string; done: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`p-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono text-muted-foreground">{num}</span>
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm font-medium">{title}</span>
        {done ? (
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 ml-auto" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto" />
        )}
      </div>
      {children}
    </div>
  );
}

function Detail({ label, value, link }: { label: string; value: string; link?: boolean }) {
  if (!value || value === "—") return null;
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block max-w-[200px]">
          {value.replace(/^https?:\/\//, "").slice(0, 30)}
          <ExternalLink className="h-3 w-3 inline ml-0.5" />
        </a>
      ) : (
        <p className="text-xs font-medium truncate">{value}</p>
      )}
    </div>
  );
}
