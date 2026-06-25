"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Eye, EyeOff, Loader2, AlertCircle, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [step2fa, setStep2fa] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const totpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/csrf").then((r) => r.json()).then((d) => setCsrfToken(d.csrfToken)).catch(() => {});
  }, []);

  useEffect(() => {
    if (step2fa) totpRef.current?.focus();
  }, [step2fa]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const creds: Record<string, string> = {
        email: email.toLowerCase().trim(),
        password,
        csrfToken,
      };
      if (step2fa) creds.totpCode = totpCode;

      const result = await signIn("credentials", {
        ...creds,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "2FA_REQUIRED") {
          setStep2fa(true);
          setError("Enter the 6-digit code from your authenticator app");
          toast.info("2FA code required");
        } else {
          const msg = result.error === "CredentialsSignin"
            ? "Invalid email or password"
            : result.error === "Invalid 2FA code"
              ? "Invalid 2FA code. Try again."
              : result.error;
          setError(msg);
          toast.error(msg);
        }
      } else {
        toast.success("Welcome back!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setStep2fa(false);
    setTotpCode("");
    setError("");
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
            <Shield className={`h-4 w-4 ${step2fa ? "text-amber-500" : "text-emerald-500"}`} />
            <h1 className="text-xl font-semibold">{step2fa ? "Two-factor auth" : "Welcome back"}</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6 ml-6">
            {step2fa ? "Enter the code from your authenticator app" : "Sign in to continue your pipeline"}
          </p>

          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm flex items-start gap-2 border ${
              step2fa && !error.includes("Invalid")
                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}>
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {step2fa ? (
              <>
                <div className="flex justify-center py-4">
                  <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Smartphone className="h-8 w-8 text-amber-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totpCode" className="text-xs font-medium">Authentication code</Label>
                  <Input
                    ref={totpRef}
                    id="totpCode"
                    type="text"
                    inputMode="numeric"
                    placeholder="000 000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    autoComplete="one-time-code"
                    className="h-11 text-center text-lg tracking-[0.5em] font-mono"
                    maxLength={6}
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={loading || totpCode.length !== 6}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying...</>
                  ) : (
                    "Verify & Sign In"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to login
                </button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                    className="h-11"
                  />
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
                      autoComplete="current-password"
                      className="pr-10 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 text-sm font-medium transition-all duration-150 active:scale-[0.98]" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Signing in...</>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {process.env.NEXT_PUBLIC_GOOGLE_ENABLED && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">or</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full h-11" onClick={() => signIn("google", { callbackUrl })}>
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continue with Google
                    </Button>
                  </>
                )}

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/signup" className="text-foreground font-medium hover:underline underline-offset-4">
                    Sign up
                  </Link>
                </p>
              </>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-4 flex items-center justify-center gap-1">
          <Shield className="h-3 w-3" />
          Secured with encryption & rate limiting
        </p>
      </div>
    </div>
  );
}
