import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
import { toSafeUser } from "../utils/auth.js";

const router = Router();

router.use(requireAuth, requireRole(UserRole.SUPERUSER));

router.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      include: {
        preferences: true,
        _count: {
          select: {
            activities: true,
            chatLogs: true,
            badges: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    res.json({
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.role === UserRole.SUPERUSER,
        createdAt: user.createdAt,
        preferences: user.preferences,
        counts: user._count
      }))
    });
  })
);

router.get(
  "/users/:userId",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.params.userId },
      include: {
        preferences: true,
        activities: {
          include: { activity: true },
          orderBy: { createdAt: "desc" }
        },
        chatLogs: {
          orderBy: { timestamp: "desc" }
        },
        badges: {
          include: { badge: true }
        },
        weeklyReports: {
          orderBy: { weekStart: "desc" }
        }
      }
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.role === UserRole.SUPERUSER,
        createdAt: user.createdAt,
        preferences: user.preferences,
        activities: user.activities,
        chatLogs: user.chatLogs,
        badges: user.badges,
        weeklyReports: user.weeklyReports
      },
      actor: toSafeUser(req.user!)
    });
  })
);

export default router;
