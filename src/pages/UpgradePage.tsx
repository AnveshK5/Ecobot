import { Check, Crown, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  { months: 1 as const, label: "1 month", price: 5, blurb: "Best for quick momentum", accent: "from-emerald-500/20 to-teal-500/10" },
  { months: 3 as const, label: "3 months", price: 12, blurb: "Most flexible for habit change", accent: "from-primary/25 to-emerald-500/10", featured: true },
  { months: 6 as const, label: "6 months", price: 22, blurb: "Longer runway for measurable progress", accent: "from-cyan-500/20 to-blue-500/10" },
  { months: 12 as const, label: "1 year", price: 40, blurb: "Best value for year-round tracking", accent: "from-amber-500/20 to-orange-500/10" }
] as const;

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default function UpgradePage() {
  const { billing, subscribeToPlan, authLoading } = useAppData();

  const currentPlanMonths = billing?.subscription?.planMonths ?? null;
  const trialDaysRemaining = billing?.isTrialActive
    ? Math.max(
        1,
        Math.ceil((new Date(billing.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-[radial-gradient(circle_at_top_right,_hsl(var(--primary)/0.28),_transparent_34%),linear-gradient(160deg,_hsl(var(--card)),_hsl(var(--secondary)/0.58))] shadow-2xl">
        <div className="grid gap-8 p-6 md:p-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div className="space-y-4">
            <Badge className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em]">
              Ecobot Pro
            </Badge>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-foreground md:text-5xl">
                Upgrade to a sharper, more professional sustainability workspace.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Unlock premium analytics, cleaner long-range planning, and a more personalized Ecobot assistant with one simple subscription.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="mt-3 text-sm font-medium">Smarter insights</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Premium recommendations built from your actual routines and categories.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
              <Zap className="h-4 w-4 text-primary" />
              <p className="mt-3 text-sm font-medium">Cleaner planning</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Track progress against goals, future scenarios, and carbon-saving opportunities.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="mt-3 text-sm font-medium">Reliable access</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Keep premium coaching available beyond the automatic 3-day free trial.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Crown className="h-5 w-5 text-primary" />
              Your access status
            </CardTitle>
            <CardDescription>
              Trial and subscription details update automatically when you log in or change plans.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {billing?.hasSubscription ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Active plan: {currentPlanMonths} month{currentPlanMonths === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Renews through {billing.subscription ? formatDate(billing.subscription.currentPeriodEnd) : "your current billing period"}.
                </p>
              </div>
            ) : billing?.isTrialActive ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Free trial active: {trialDaysRemaining} day{trialDaysRemaining === 1 ? "" : "s"} left
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Trial started on {formatDate(billing.trialStartsAt)} and ends on {formatDate(billing.trialEndsAt)}.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-foreground">No active subscription</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Your free trial ended on {billing ? formatDate(billing.trialEndsAt) : "your trial date"}. Choose a plan to restore premium access.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Included with Pro</p>
              <div className="mt-3 space-y-3">
                {[
                  "Personalized recommendations tied to your own activity history",
                  "Advanced visual reporting for daily, monthly, and yearly category performance",
                  "Future-path coaching that compares your current habits against a lower-emission direction",
                  "Enterprise-style plan management built for polished demos and long-term retention"
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="text-sm leading-6 text-muted-foreground">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 md:grid-cols-2">
          {plans.map((plan) => {
            const isCurrent = currentPlanMonths === plan.months;

            return (
              <Card
                key={plan.months}
                className={`relative overflow-hidden rounded-[1.75rem] border-border/60 bg-card/95 shadow-xl ${plan.featured ? "ring-1 ring-primary/30" : ""}`}
              >
                <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${plan.accent}`} />
                <CardHeader className="relative space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{plan.label}</p>
                      <CardDescription className="mt-1">{plan.blurb}</CardDescription>
                    </div>
                    {plan.featured ? <Badge>Popular</Badge> : null}
                  </div>
                  <div>
                    <p className="text-4xl font-semibold tracking-tight text-foreground">${plan.price}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      ${Math.ceil((plan.price / plan.months) * 100) / 100} per month
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-5">
                  <div className="space-y-3">
                    {[
                      "Premium AI coaching",
                      "Advanced dashboard insights",
                      "Professional reporting views",
                      "Priority-ready demo presentation"
                    ].map((feature) => (
                      <div key={`${plan.months}-${feature}`} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={authLoading || isCurrent}
                    onClick={() => void subscribeToPlan(plan.months)}
                  >
                    {isCurrent ? "Current plan" : `Choose ${plan.label}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
