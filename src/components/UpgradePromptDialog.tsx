import { Link } from "react-router-dom";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

export default function UpgradePromptDialog() {
  const { billing, upgradePromptOpen, dismissUpgradePrompt } = useAppData();

  if (!billing) {
    return null;
  }

  const eyebrow = billing.isTrialActive ? "3-day free trial active" : "Trial expired";
  const heading = billing.isTrialActive
    ? `Your free trial runs until ${formatDate(billing.trialEndsAt)}`
    : "Unlock premium sustainability coaching";
  const description = billing.isTrialActive
    ? "Upgrade before your trial ends to keep premium recommendations, richer analytics, and pro-grade planning in one place."
    : "Upgrade to restore premium recommendations, long-horizon insights, and enterprise-style planning tools.";

  return (
    <Dialog open={upgradePromptOpen} onOpenChange={(open) => !open && dismissUpgradePrompt()}>
      <DialogContent className="max-w-xl overflow-hidden rounded-3xl border-border/70 bg-card p-0 shadow-2xl">
        <div className="border-b border-border/60 bg-[radial-gradient(circle_at_top_right,_hsl(var(--primary)/0.22),_transparent_40%),linear-gradient(160deg,_hsl(var(--card)),_hsl(var(--secondary)/0.55))] p-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <DialogHeader className="mt-4 space-y-3 text-left">
            <DialogTitle className="text-2xl font-semibold leading-tight">
              {heading}
            </DialogTitle>
            <DialogDescription className="max-w-lg text-sm leading-6 text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-4 p-7 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-secondary/25 p-4">
            <Clock3 className="h-4 w-4 text-primary" />
            <p className="mt-3 text-sm font-medium text-foreground">Premium analytics</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Compare current habits against a lower-carbon future with richer long-range views.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-secondary/25 p-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="mt-3 text-sm font-medium text-foreground">Sharper recommendations</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Get more targeted suggestions built from your own travel, food, energy, and shopping data.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-secondary/25 p-4">
            <ArrowRight className="h-4 w-4 text-primary" />
            <p className="mt-3 text-sm font-medium text-foreground">Pro planning</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Keep progress tracking, premium coaching, and sustainability reporting in one workflow.
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 px-7 py-5">
          <Button variant="outline" onClick={dismissUpgradePrompt}>
            Maybe later
          </Button>
          <Button asChild>
            <Link to="/upgrade" onClick={dismissUpgradePrompt}>
              View plans
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
