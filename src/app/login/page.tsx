"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { clearOfflineDB } from "@/lib/services/offline-store";

export default function StudentLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Login failed");
        setLoading(false);
        return;
      }

      const userData = await res.json();
      const prevUserId = localStorage.getItem('dormdesk_user_id');
      if (prevUserId !== userData.id) {
        await clearOfflineDB().catch(console.error);
      }
      localStorage.setItem('dormdesk_user_id', userData.id);
      const authName = userData.authority?.name;
      if (authName === "STUDENT") {
        router.push("/student");
      } else if (authName === "FACULTY") {
        router.push("/faculty");
      } else if (authName === "WARDEN" || authName === "STAFF") {
        router.push("/warden");
      } else if (authName === "HOD") {
        router.push("/hod");
      } else if (authName === "PRINCIPAL") {
        router.push("/principal");
      } else if (authName === "SYSTEM_ADMIN") {
        router.push("/admin/command-center");
      } else {
        router.push("/login");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during login.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md shadow-sm border-border">
        <CardHeader className="space-y-2 text-center pb-8 pt-6">
          <CardTitle className="text-3xl text-text-primary font-semibold tracking-tight">DormDesk</CardTitle>
          <p className="text-sm text-text-secondary">Student Portal Login</p>
        </CardHeader>
        <form onSubmit={handleLogin} noValidate>
          <CardContent className="space-y-6">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 p-4 text-sm bg-error-bg text-error rounded-md border border-error/20"
              >
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@dormdesk.edu"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error}
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-5 pb-6">
            <Button className="w-full" type="submit" disabled={loading} size="default">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <div className="text-sm text-center text-text-secondary">
              Staff or Admin? <Link href="/admin/login" className="text-info hover:underline font-medium">Log in here</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

