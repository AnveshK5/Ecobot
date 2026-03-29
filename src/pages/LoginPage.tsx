import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { LogIn, Flame, Leaf, Trophy, Zap, Target } from "lucide-react";
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
    const destination =
      (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname || "/";
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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.22),_transparent_32%),radial-gradient(circle_at_bottom_right,_hsl(var(--primary)/0.14),_transparent_28%),linear-gradient(135deg,_hsl(var(--background)),_hsl(var(--secondary)/0.45),_hsl(var(--background)))] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-10 top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-16 top-24 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-44 w-44 rounded-full bg-lime-300/10 blur-3xl" />
      </div>

      {/* grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(hsl(var(--foreground))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground))_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_minmax(360px,470px)] lg:gap-10">
          {/* Left Panel */}
          <section className="hidden rounded-[2rem] border border-border/60 bg-card/60 p-8 shadow-2xl backdrop-blur-xl xl:flex xl:flex-col xl:justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-base font-semibold shadow-lg">
                  EC
                </div>
                <div>
                  <span className="block text-xl font-semibold tracking-tight">Ecobot</span>
                  <span className="text-sm text-muted-foreground">
                    Sustainable lifestyle mission
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  🌍 Play your way to a greener life
                </div>

                <h1 className="max-w-2xl text-5xl font-extrabold leading-tight text-foreground">
                  Turn your daily choices into an
                  <span className="block bg-gradient-to-r from-primary via-emerald-400 to-lime-300 bg-clip-text text-transparent">
                    eco challenge.
                  </span>
                </h1>

                <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                  Track food, travel, energy, and shopping habits. Get AI-powered
                  suggestions, build streaks, unlock badges, and improve your carbon score.
                </p>
              </div>

              {/* top stats */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border/60 bg-background/40 p-4 transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Level</p>
                  <p className="mt-2 text-2xl font-bold">3</p>
                  <p className="text-sm text-muted-foreground">Eco Explorer</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/40 p-4 transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500">
                    <Flame className="h-5 w-5" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Streak</p>
                  <p className="mt-2 text-2xl font-bold">7 Days</p>
                  <p className="text-sm text-muted-foreground">Daily eco logging</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/40 p-4 transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/15 text-yellow-500">
                    <Zap className="h-5 w-5" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">XP</p>
                  <p className="mt-2 text-2xl font-bold">240</p>
                  <p className="text-sm text-muted-foreground">Points earned</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/40 p-4 transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Badges</p>
                  <p className="mt-2 text-2xl font-bold">3</p>
                  <p className="text-sm text-muted-foreground">Unlocked rewards</p>
                </div>
              </div>

              {/* feature cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-border/60 bg-secondary/40 p-5 transition hover:-translate-y-1 hover:shadow-lg">
                  <p className="mb-3 text-2xl">🚗</p>
                  <p className="text-lg font-semibold">Track habits</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Measure how travel, food, and shopping affect your footprint.
                  </p>
                </div>

                <div className="rounded-3xl border border-border/60 bg-secondary/40 p-5 transition hover:-translate-y-1 hover:shadow-lg">
                  <p className="mb-3 text-2xl">🤖</p>
                  <p className="text-lg font-semibold">AI coach</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Get smarter suggestions instead of basic generic advice.
                  </p>
                </div>

                <div className="rounded-3xl border border-border/60 bg-secondary/40 p-5 transition hover:-translate-y-1 hover:shadow-lg">
                  <p className="mb-3 text-2xl">🏆</p>
                  <p className="text-lg font-semibold">Progress system</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Build streaks, earn badges, and level up your eco lifestyle.
                  </p>
                </div>
              </div>
            </div>

            {/* bottom progress section */}
            <div className="mt-8 rounded-3xl border border-primary/10 bg-background/40 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Next mission progress</p>
                  <p className="text-xs text-muted-foreground">
                    Complete 3 more actions to unlock Planet Protector
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Target className="h-3.5 w-3.5" />
                  72%
                </div>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-primary via-emerald-400 to-lime-300" />
              </div>
            </div>
          </section>

          {/* Right Panel */}
          <Card className="mx-auto w-full max-w-xl rounded-[2rem] border-border/60 bg-card/80 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-4">
              <div className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Start your mission
              </div>

              <CardTitle className="flex items-center gap-2 text-3xl">
                <LogIn className="h-6 w-6 text-primary" />
                Sign In
              </CardTitle>

              <CardDescription className="text-sm leading-6">
                Continue your streak, track your carbon footprint, and unlock your next eco achievement.
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
                    className="h-12 rounded-2xl border-border/60 bg-background/50"
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
                    className="h-12 rounded-2xl border-border/60 bg-background/50"
                  />
                </div>

                {(localError || authError) && (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {localError || authError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="h-12 w-full rounded-2xl text-base font-semibold shadow-lg"
                  disabled={authLoading}
                >
                  {authLoading ? "Starting mission..." : "Start Mission"}
                </Button>

                {/* mini stats */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-secondary/40 p-3 text-center">
                    <p className="text-lg font-bold text-primary">12k+</p>
                    <p className="text-xs text-muted-foreground">Actions logged</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-secondary/40 p-3 text-center">
                    <p className="text-lg font-bold text-emerald-500">4.8★</p>
                    <p className="text-xs text-muted-foreground">Coach rating</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-secondary/40 p-3 text-center">
                    <p className="text-lg font-bold text-lime-500">+35%</p>
                    <p className="text-xs text-muted-foreground">Habit improvement</p>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  New here?{" "}
                  <Link
                    to="/register"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
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
