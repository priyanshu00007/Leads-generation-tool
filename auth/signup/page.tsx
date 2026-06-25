"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Eye, EyeOff, Loader2, AlertCircle, Shield, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Lowercase letter", pass: /[a-z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special character", pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ], [password]);

  const strength = checks.filter((c) => c.pass).length;
  const width = `${(strength / checks.length) * 100}%`;
  const color = strength <= 2 ? "bg-destructive" : strength <= 3 ? "bg-amber-500" : strength <= 4 ? "bg-blue-500" : "bg-emerald-500";

  return (
    <div className="space-y-1.5 mt-1">
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width }} />
      </div>
      <div className="grid grid-cols-1 gap-0.5">
        {checks.map((c) => (
          <div key={c.label} className={`flex items-center gap-1.5 text-[10px] ${c.pass ? "text-emerald-500" : "text-muted-foreground/50"}`}>
            {c.pass ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    fetch("/api/csrf").then((r) => r.json()).then((d) => setCsrfToken(d.csrfToken)).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ name, email: email.toLowerCase().trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      toast.success("Account created! Sign in to continue.");
      router.push("/auth/login");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="h-6 w-6 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <div className="font-display text-2xl tracking-tight">Lead <span className="text-muted-foreground">→</span> Launch</div>
            <div className="text-xs text-muted-foreground tracking-wide uppercase mt-0.5">AI-powered freelance pipeline</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-emerald-500" />
            <h1 className="text-xl font-semibold">Create your account</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6 ml-6">Start finding clients and launching websites</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2 border border-destructive/20">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>
              <Input id="name" type="text" placeholder="Priyanshu Rathod" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="pr-10 h-11"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && <PasswordStrength password={password} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-sm font-medium transition-all duration-150 active:scale-[0.98]" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating account...</>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-foreground font-medium hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-4 flex items-center justify-center gap-1">
          <Shield className="h-3 w-3" />
          End-to-end encrypted · Rate-limited · No plaintext passwords
        </p>
      </div>
    </div>
  );
}
