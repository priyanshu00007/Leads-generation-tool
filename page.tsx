"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import { Stepper } from "@/components/Stepper";
import { Phase1Scrape } from "@/components/Phase1Scrape";
import { Phase2Audit } from "@/components/Phase2Audit";
import { Phase3Rank } from "@/components/Phase3Rank";
import { Phase4Build } from "@/components/Phase4Build";
import { Phase5Outreach } from "@/components/Phase5Outreach";
import { scoreLead } from "@/lib/scoring";
import type { Lead, AuditResult, BuildPlatform } from "@/lib/types";
import { Sparkles, Sun, Moon, Monitor, Heart, LogOut, FolderOpen, Plus, Loader2, ChevronDown, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/api";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const { data: session } = useSession();
  const [phase, setPhase] = useState(1);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [audits, setAudits] = useState<Record<string, AuditResult>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<BuildPlatform[]>(["lovable"]);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Persistence state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; lead_count: number }>>([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const initRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // Initialize project once on mount
  const initProject = useCallback(async () => {
    if (initRef.current) return;
    initRef.current = true;
    try {
      setLoadingProject(true);
      const { projects: existingProjects } = await api.getProjects();
      setProjects(existingProjects);

      if (existingProjects.length > 0) {
        const latest = existingProjects[0];
        setProjectId(latest.id);
        await loadProjectData(latest.id);
      } else {
        const { project } = await api.createProject({
          name: `Pipeline ${new Date().toLocaleDateString("en-IN")}`,
        });
        setProjectId(project.id);
      }
    } catch (error) {
      console.error("Failed to initialize project:", error);
    } finally {
      setLoadingProject(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      initProject();
    }
  }, [session, initProject]);

  // Load project data from DB
  async function loadProjectData(pid: string) {
    try {
      const { project } = await api.getProject(pid);
      if (project.leads.length > 0) {
        const loadedLeads: Lead[] = project.leads.map((l) => ({
          id: l.id,
          name: l.name,
          category: l.category,
          address: l.address,
          city: l.city,
          phone: l.phone || undefined,
          whatsapp: l.whatsapp || undefined,
          email: l.email || undefined,
          website: l.website || undefined,
          rating: l.rating || undefined,
          reviewsCount: l.reviewsCount || undefined,
          lat: l.lat,
          lng: l.lng,
          photosCount: l.photosCount || undefined,
          yearsInBusiness: l.yearsInBusiness || undefined,
        }));
        setLeads(loadedLeads);

        const loadedAudits: Record<string, AuditResult> = {};
        project.leads.forEach((l) => {
          if (l.audit) {
            loadedAudits[l.id] = {
              leadId: l.id,
              pageSpeedScore: l.audit.pageSpeedScore,
              hasWebsite: l.audit.hasWebsite,
              mobileFriendly: l.audit.mobileFriendly,
              https: l.audit.https,
              hasSchema: l.audit.hasSchema,
              loadTimeMs: l.audit.loadTimeMs,
              gaps: l.audit.gaps,
              biggestGap: l.audit.biggestGap,
              estLostRevenuePerMonth: l.audit.estLostRevenuePerMonth,
            };
          }
        });
        setAudits(loadedAudits);
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    }
  }

  // Switch project
  async function switchProject(pid: string) {
    setProjectId(pid);
    setLeads([]);
    setAudits({});
    setSelectedId(null);
    setPhase(1);
    setProjectMenuOpen(false);
    await loadProjectData(pid);
  }

  // Create new project
  async function createNewProject() {
    try {
      const { project } = await api.createProject({
        name: `Pipeline ${new Date().toLocaleDateString("en-IN")}`,
      });
      setProjectId(project.id);
      setLeads([]);
      setAudits({});
      setSelectedId(null);
      setPhase(1);
      setProjects((prev) => [{ id: project.id, name: project.name, lead_count: 0 }, ...prev]);
      setProjectMenuOpen(false);
      toast.success("New project created!");
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  }

  // Persist leads to DB
  const persistLeads = useCallback(
    async (newLeads: Lead[]) => {
      if (!projectId) return;
      try {
        setSaving(true);
        await api.saveLeads(projectId, newLeads);
      } catch (error) {
        console.error("Failed to save leads:", error);
      } finally {
        setSaving(false);
      }
    },
    [projectId]
  );

  // Persist audits to DB
  const persistAudits = useCallback(
    async (newAudits: Record<string, AuditResult>) => {
      if (!projectId) return;
      try {
        setSaving(true);
        const auditEntries = Object.entries(newAudits).map(([leadId, audit]) => ({
          leadId,
          audit,
        }));
        if (auditEntries.length > 0) {
          await api.saveAuditsBatch(auditEntries);
        }
      } catch (error) {
        console.error("Failed to save audits:", error);
      } finally {
        setSaving(false);
      }
    },
    [projectId]
  );

  // Log search
  const persistSearch = useCallback(
    async (niche: string, city: string, count: number, resultCount: number) => {
      if (!projectId) return;
      try {
        await api.logSearch({ projectId, niche, city, count, resultCount });
      } catch (error) {
        console.error("Failed to log search:", error);
      }
    },
    [projectId]
  );

  // Log outreach
  const persistOutreach = useCallback(
    async (data: {
      leadId?: string;
      channel: string;
      language: string;
      tone: string;
      subject?: string;
      message: string;
    }) => {
      if (!projectId) return;
      try {
        await api.logOutreach({ ...data, projectId });
      } catch (error) {
        console.error("Failed to log outreach:", error);
      }
    },
    [projectId]
  );

  const completed = useMemo(() => {
    const s = new Set<number>();
    if (leads.length > 0) s.add(1);
    if (Object.keys(audits).length > 0) s.add(2);
    if (selectedId) {
      s.add(3);
      s.add(4);
    }
    return s;
  }, [leads, audits, selectedId]);

  const selectedRanked = useMemo(() => {
    if (!selectedId) return null;
    const lead = leads.find((l) => l.id === selectedId);
    const audit = audits[selectedId];
    if (!lead || !audit) return null;
    return scoreLead(lead, audit);
  }, [selectedId, leads, audits]);

  function cycleTheme() {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  const ThemeIcon = !mounted ? Monitor : theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  if (!session) return null;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-foreground focus:text-background focus:px-3 focus:py-2 focus:rounded-md focus:text-sm"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <div className="font-display text-xl leading-none">Lead <span className="text-muted-foreground">→</span> Launch</div>
              <div className="text-[11px] text-muted-foreground leading-tight tracking-wide uppercase mt-1">AI-powered freelance pipeline</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Saving indicator */}
            {saving && (
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </div>
            )}

            {/* Project selector */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-2 text-xs"
                onClick={() => setProjectMenuOpen(!projectMenuOpen)}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                {projects.find((p) => p.id === projectId)?.name || "Project"}
                <ChevronDown className="h-3 w-3" />
              </Button>
              {projectMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-border bg-card shadow-lg z-50 p-1">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => switchProject(p.id)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        p.id === projectId
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs opacity-70">{p.lead_count} leads</div>
                    </button>
                  ))}
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={createNewProject}
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted flex items-center gap-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New Project
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                {session.user?.image ? (
                  <img src={session.user.image} alt="" className="h-5 w-5 rounded-full" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </Button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-card shadow-lg z-50 p-1">
                  <div className="px-3 py-2 border-b border-border">
                    <div className="text-sm font-medium">{session.user?.name || "User"}</div>
                    <div className="text-xs text-muted-foreground">{session.user?.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push("/profile");
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  {(session.user as any)?.role === "admin" && (
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push("/admin");
                      }}
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted flex items-center gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Admin
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      cycleTheme();
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted flex items-center gap-2"
                  >
                    <ThemeIcon className="h-4 w-4" />
                    Theme: {theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System"}
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut({ callbackUrl: "/auth/login" });
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted flex items-center gap-2 text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground tracking-[0.15em] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground/60" aria-hidden="true" />
              Local · private · yours
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 sm:hidden"
              onClick={cycleTheme}
              aria-label="Switch theme"
            >
              <ThemeIcon className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
        <Stepper current={phase} completed={completed} onJump={(n) => setPhase(n)} />
      </header>
      <main id="main" className="pt-6 flex-1" tabIndex={-1}>
        {loadingProject ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {phase === 1 && (
              <Phase1Scrape
                key="p1"
                leads={leads}
                setLeads={(newLeads) => {
                  setLeads(newLeads);
                  if (newLeads.length > 0) persistLeads(newLeads);
                }}
                onNext={() => setPhase(2)}
                onSearch={persistSearch}
              />
            )}
            {phase === 2 && (
              <Phase2Audit
                key="p2"
                leads={leads}
                audits={audits}
                setAudits={(newAudits) => {
                  setAudits(newAudits);
                  if (Object.keys(newAudits).length > 0) persistAudits(newAudits);
                }}
                onNext={() => setPhase(3)}
                onPrev={() => setPhase(1)}
              />
            )}
            {phase === 3 && (
              <Phase3Rank
                key="p3"
                leads={leads}
                audits={audits}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                selectedPlatforms={selectedPlatforms}
                setSelectedPlatforms={setSelectedPlatforms}
                onNext={() => setPhase(4)}
                onPrev={() => setPhase(2)}
              />
            )}
            {phase === 4 && (
              <Phase4Build
                key="p4"
                selected={selectedRanked}
                selectedPlatforms={selectedPlatforms}
                onNext={() => setPhase(5)}
                onPrev={() => setPhase(3)}
              />
            )}
            {phase === 5 && (
              <Phase5Outreach
                key="p5"
                selected={selectedRanked}
                onPrev={() => setPhase(4)}
                onSend={persistOutreach}
              />
            )}
          </AnimatePresence>
        )}
      </main>
      <footer className="border-t border-border bg-background/60 backdrop-blur mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Lead → Launch</span>
              <span className="text-border">·</span>
              <span>Built with</span>
              <Heart className="h-3 w-3 fill-[color:var(--destructive)] text-[color:var(--destructive)]" />
              <span>for Indian freelancers</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Gemini AI · Next.js · Tailwind</span>
              <span className="text-border">·</span>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
