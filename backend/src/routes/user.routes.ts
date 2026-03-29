import { Router } from "express";
import { UserRole } from "@prisma/client";
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

router.use(requireAuth);

router.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      include: {
        preferences: true,
        badges: { include: { badge: true } }
      }
    });

    res.json({
      user: {
        ...toSafeUser(user),
        createdAt: user.createdAt
      },
      preferences: user.preferences,
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
