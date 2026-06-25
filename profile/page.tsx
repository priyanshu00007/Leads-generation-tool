"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sparkles, User, Mail, Calendar, Globe, Search, Target, FileCheck, MessageSquare, ArrowRight, Loader2, Shield, Clock, Building2, Star, Phone, MapPin, Smartphone, Key, Check, X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as api from "@/lib/api";

type ProfileData = {
  user: { id: string; name: string; email: string; image: string | null; createdAt: string; updatedAt: string };
  stats: { projects: number; leads: number; audits: number; searches: number; outreach: number };
  leads: Array<any>;
  categories: string[];
  searches: Array<any>;
};

const statIcons: Record<string, React.ReactNode> = {
  projects: <FolderOpen className="h-5 w-5" />,
  leads: <Target className="h-5 w-5" />,
  audits: <FileCheck className="h-5 w-5" />,
  searches: <Search className="h-5 w-5" />,
  outreach: <MessageSquare className="h-5 w-5" />,
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <span className="font-display text-lg">Lead <span className="text-muted-foreground">→</span> Launch</span>
          </button>
          <Button variant="outline" size="sm" onClick={() => router.push("/")}>
            <ArrowRight className="h-3.5 w-3.5 mr-1.5 rotate-180" /> Back
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
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
              <div className="flex justify-center mb-2 text-muted-foreground">{statIcons[key]}</div>
              <div className="text-2xl font-display font-bold tabular-nums">{value}</div>
              <div className="text-[11px] text-muted-foreground capitalize mt-0.5">{key}</div>
            </div>
          ))}
        </div>

        {/* Activity Summary */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm mb-6">
          <h2 className="text-lg font-display font-semibold mb-1 flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Activity Summary
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Total data points tracked: <span className="font-semibold text-foreground">{total}</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard icon={<Building2 className="h-4 w-4" />} label="Projects created" value={stats?.projects ?? 0} />
            <SummaryCard icon={<Target className="h-4 w-4" />} label="Leads found" value={stats?.leads ?? 0} />
            <SummaryCard icon={<Search className="h-4 w-4" />} label="Searches performed" value={stats?.searches ?? 0} />
            <SummaryCard icon={<MessageSquare className="h-4 w-4" />} label="Outreach messages sent" value={stats?.outreach ?? 0} />
          </div>
        </div>

        {/* Security / 2FA */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm mb-6">
          <h2 className="text-lg font-display font-semibold mb-1 flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Security
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Two-factor authentication adds an extra layer of security to your account.</p>
          <MfaSetup />
        </div>

        {/* Recent Leads */}
        {data?.leads && data.leads.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Recent Leads
            </h2>
            <div className="divide-y divide-border">
              {data.leads.slice(0, 10).map((lead: any, i: number) => (
                <div key={i} className="py-3 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{lead.name || lead.business_name}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.city || lead.address_city}</span>
                      <span className="flex items-center gap-1">{lead.category}</span>
                      {(lead.rating || lead.rating > 0) && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{Number(lead.rating ?? 0).toFixed(1)}</span>}
                      {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 mt-1">
                      Project: {lead.project_name || lead.projectName} · {new Date(lead.created_at || lead.createdAt).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <div className="text-lg font-semibold tabular-nums">{value}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function Activity(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>; }
function FolderOpen(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z" /><path d="M2 8h20" /></svg>; }

function MfaSetup() {
  const [mfa, setMfa] = useState<{ enabled: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState<{ secret: string; qrCode: string; otpauth: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/profile/mfa").then((r) => r.json()).then(setMfa).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSetup() {
    setBusy(true); setMessage("");
    try {
      const res = await fetch("/api/profile/mfa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await res.json();
      if (res.ok) { setSetup(data); setShowSetup(true); }
      else setMessage(data.error);
    } catch { setMessage("Failed to start setup"); }
    finally { setBusy(false); }
  }

  async function handleEnable() {
    if (totpCode.length !== 6) return;
    setBusy(true); setMessage("");
    try {
      const res = await fetch("/api/profile/mfa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", token: totpCode }),
      });
      const data = await res.json();
      if (res.ok) { setMfa({ enabled: true }); setShowSetup(false); setSetup(null); setTotpCode(""); toast.success("2FA enabled"); }
      else setMessage(data.error);
    } catch { setMessage("Failed to enable 2FA"); }
    finally { setBusy(false); }
  }

  async function handleDisable() {
    if (totpCode.length !== 6) return;
    setBusy(true); setMessage("");
    try {
      const res = await fetch("/api/profile/mfa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", token: totpCode }),
      });
      const data = await res.json();
      if (res.ok) { setMfa({ enabled: false }); setTotpCode(""); toast.success("2FA disabled"); }
      else setMessage(data.error);
    } catch { setMessage("Failed to disable 2FA"); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="h-8 flex items-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;

  if (showSetup && setup) {
    return (
      <div className="space-y-4">
        {message && <p className="text-sm text-destructive">{message}</p>}
        <div className="flex justify-center">
          <img src={setup.qrCode} alt="2FA QR Code" className="rounded-lg border border-border" width={180} height={180} />
        </div>
        <p className="text-sm text-muted-foreground text-center">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
        <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between gap-2">
          <code className="text-xs font-mono break-all select-all">{setup.secret}</code>
          <button onClick={() => { navigator.clipboard.writeText(setup.secret); toast.success("Copied"); }} className="shrink-0 text-muted-foreground hover:text-foreground">
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center">Or manually enter the secret key above</p>
        <div className="space-y-2">
          <label className="text-xs font-medium">Enter 6-digit code to verify</label>
          <input type="text" inputMode="numeric" placeholder="000 000" value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full h-10 rounded-lg border border-border bg-background px-3 text-center text-lg tracking-[0.5em] font-mono" maxLength={6} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { setShowSetup(false); setSetup(null); setMessage(""); }} variant="outline" className="flex-1">
            <X className="h-3.5 w-3.5 mr-1.5" /> Cancel
          </Button>
          <Button size="sm" onClick={handleEnable} disabled={busy || totpCode.length !== 6} className="flex-1">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
            Enable 2FA
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && <p className="text-sm text-destructive">{message}</p>}
      {mfa?.enabled ? (
        <>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">2FA is enabled</div>
              <div className="text-xs text-muted-foreground">Your account is protected with two-factor authentication</div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium">Enter code to disable 2FA</label>
            <input type="text" inputMode="numeric" placeholder="000 000" value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-center text-lg tracking-[0.5em] font-mono" maxLength={6} />
          </div>
          <Button size="sm" variant="destructive" onClick={handleDisable} disabled={busy || totpCode.length !== 6}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <X className="h-3.5 w-3.5 mr-1.5" />}
            Disable 2FA
          </Button>
        </>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">2FA is not enabled</div>
            <div className="text-xs text-muted-foreground">Add an extra layer of security to your account</div>
          </div>
          <Button size="sm" onClick={handleSetup} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5 mr-1.5" />}
            Set up
          </Button>
        </div>
      )}
    </div>
  );
}
