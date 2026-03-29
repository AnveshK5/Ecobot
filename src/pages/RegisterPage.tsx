import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const { isAuthenticated, register, authLoading, authError } = useAppData();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return;
    }

    setLocalError(null);

    try {
      await register({ name, email, password });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Unable to register");
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_hsl(var(--accent)/0.16),_transparent_35%),linear-gradient(160deg,_hsl(var(--background)),_hsl(var(--secondary)/0.45))] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(360px,460px)_1fr] lg:gap-10">
          <Card className="order-2 mx-auto w-full max-w-xl border-border/60 bg-card/90 shadow-2xl backdrop-blur lg:order-1">
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <UserPlus className="h-5 w-5 text-primary" />
                Create Account
              </CardTitle>
              <CardDescription>
                Start tracking your sustainability habits with your own secure profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Justin Bieber"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirm Password</Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Repeat password"
                      required
                    />
                  </div>
                </div>

                {(localError || authError) && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {localError || authError}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={authLoading}>
                  {authLoading ? "Creating account..." : "Create Account"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>

          <section className="order-1 hidden rounded-[2rem] border border-border/60 bg-card/70 p-8 shadow-2xl backdrop-blur xl:flex xl:flex-col xl:justify-between lg:order-2">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-base font-semibold">
                  EC
                </div>
                <span className="text-xl font-semibold tracking-tight">Ecobot</span>
              </div>
              <div className="space-y-4">
                <h1 className="max-w-md text-4xl font-bold leading-tight text-foreground">
                  Build better habits with a dashboard that makes sustainability measurable.
                </h1>
                <p className="max-w-lg text-base text-muted-foreground">
                  Your account stores activity history, carbon summaries, AI conversations, and sustainability milestones.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Secure</p>
                <p className="mt-2 text-sm font-medium">JWT auth backed by encrypted passwords.</p>
              </div>
              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Actionable</p>
                <p className="mt-2 text-sm font-medium">AI suggestions tailored to your own activity data.</p>
              </div>
              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Motivating</p>
                <p className="mt-2 text-sm font-medium">Track streaks, badges, and leaderboard movement.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
