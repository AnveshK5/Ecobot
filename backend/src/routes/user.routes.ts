import { Router } from "express";
import { SubscriptionStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { toSafeUser } from "../utils/auth.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

const preferencesSchema = z.object({
  dietType: z.string().min(1).max(50).optional(),
  transportMode: z.string().min(1).max(50).optional(),
  energyUsageType: z.string().min(1).max(50).optional(),
  units: z.enum(["metric", "imperial"]).optional()
});

const subscriptionSchema = z.object({
  planMonths: z.enum(["1", "3", "6", "12"]).transform((value) => Number(value))
});

const PLAN_PRICING: Record<number, number> = {
  1: 5,
  3: 12,
  6: 22,
  12: 40
};

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function buildSubscriptionSnapshot(user: {
  createdAt: Date;
  subscription?: {
    planMonths: number;
    priceUsd: number;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  } | null;
}) {
  const now = new Date();
  const trialStartsAt = user.createdAt;
  const trialEndsAt = addDays(trialStartsAt, 3);
  const activeSubscription =
    user.subscription &&
    user.subscription.status === SubscriptionStatus.ACTIVE &&
    user.subscription.currentPeriodEnd > now
      ? user.subscription
      : null;

  return {
    hasSubscription: Boolean(activeSubscription),
    isTrialActive: !activeSubscription && trialEndsAt > now,
    trialStartsAt,
    trialEndsAt,
    subscription: activeSubscription
      ? {
          planMonths: activeSubscription.planMonths,
          priceUsd: activeSubscription.priceUsd,
          status: activeSubscription.status,
          currentPeriodStart: activeSubscription.currentPeriodStart,
          currentPeriodEnd: activeSubscription.currentPeriodEnd
        }
      : null
  };
}

router.use(requireAuth);

router.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      include: {
        preferences: true,
        badges: { include: { badge: true } },
        subscription: true
      }
    });

    res.json({
      user: {
        ...toSafeUser(user),
        createdAt: user.createdAt
      },
      preferences: user.preferences,
      billing: buildSubscriptionSnapshot(user),
      badges: user.badges.map((entry) => ({
        id: entry.badge.id,
        key: entry.badge.key,
        name: entry.badge.name,
        description: entry.badge.description,
        awardedAt: entry.awardedAt
      }))
    });
  })
);

router.get(
  "/subscription",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      include: {
        subscription: true
      }
    });

    res.json({
      billing: buildSubscriptionSnapshot(user)
    });
  })
);

router.post(
  "/subscription",
  asyncHandler(async (req, res) => {
    const input = subscriptionSchema.parse(req.body);
    const now = new Date();
    const priceUsd = PLAN_PRICING[input.planMonths];

    const subscription = await prisma.subscription.upsert({
      where: { userId: req.user!.id },
      update: {
        planMonths: input.planMonths,
        priceUsd,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: addMonths(now, input.planMonths)
      },
      create: {
        userId: req.user!.id,
        planMonths: input.planMonths,
        priceUsd,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: addMonths(now, input.planMonths)
      }
    });

    res.status(201).json({
      billing: {
        hasSubscription: true,
        isTrialActive: false,
        trialStartsAt: now,
        trialEndsAt: now,
        subscription: {
          planMonths: subscription.planMonths,
          priceUsd: subscription.priceUsd,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      }
    });
  })
);

router.put(
  "/preferences",
  asyncHandler(async (req, res) => {
    const updates = preferencesSchema.parse(req.body);

    const preferences = await prisma.preference.upsert({
      where: { userId: req.user!.id },
      update: updates,
      create: {
        userId: req.user!.id,
        ...updates
      }
    });

    res.json({
      preferences,
      actor: {
        id: req.user!.id,
        role: req.user!.role,
        isAdmin: req.user!.role === UserRole.SUPERUSER
      }
    });
  })
);

export default router;
