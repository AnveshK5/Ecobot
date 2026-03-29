import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { isAuthenticated, login, authLoading, authError } = useAppData();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  if (isAuthenticated) {
    const destination = (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname || "/";
    return <Navigate to={destination} replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    try {
      await login(email, password);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Unable to sign in");
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.18),_transparent_36%),linear-gradient(135deg,_hsl(var(--background)),_hsl(var(--secondary)/0.55))] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_minmax(360px,460px)] lg:gap-10">
          <section className="hidden rounded-[2rem] border border-border/60 bg-card/70 p-8 shadow-2xl backdrop-blur xl:flex xl:flex-col xl:justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-3 text-primary">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-base font-semibold">
                  EC
                </div>
                <span className="text-xl font-semibold tracking-tight">Ecobot</span>
              </div>
              <div className="space-y-4">
                <h1 className="max-w-md text-4xl font-bold leading-tight text-foreground">
                  Sign in to track the footprint behind your daily choices.
                </h1>
                <p className="max-w-lg text-base text-muted-foreground">
                  Log food, transport, energy, and shopping habits, then get AI-backed sustainability suggestions in one dashboard.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Transport</p>
                <p className="mt-2 text-sm font-medium">See how daily travel impacts emissions.</p>
              </div>
              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">AI Coach</p>
                <p className="mt-2 text-sm font-medium">Get personalized tips instead of generic advice.</p>
              </div>
              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Progress</p>
                <p className="mt-2 text-sm font-medium">Follow streaks, badges, and weekly carbon summaries.</p>
              </div>
            </div>
          </section>

          <Card className="mx-auto w-full max-w-xl border-border/60 bg-card/90 shadow-2xl backdrop-blur">
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <LogIn className="h-5 w-5 text-primary" />
                Sign In
              </CardTitle>
              <CardDescription>
                Use your account to access the AI Sustainable Lifestyle Assistant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>

                {(localError || authError) && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {localError || authError}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={authLoading}>
                  {authLoading ? "Signing in..." : "Sign In"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  New here?{" "}
                  <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
                    Create an account
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
