import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { awardBadgesForUser } from "../services/gamification.service.js";
import { ApiError, asyncHandler } from "../utils/http.js";

const router = Router();

const logActivitySchema = z.object({
  activityId: z.string().uuid(),
  customInput: z.record(z.any()).default({}),
  quantity: z.number().positive().default(1),
  description: z.string().max(240).optional()
});

const batchLogActivitySchema = z.object({
  entries: z.array(logActivitySchema).min(1).max(25)
});

router.use(requireAuth);

router.post(
  "/log",
  asyncHandler(async (req, res) => {
    const input = logActivitySchema.parse(req.body);

    const activity = await prisma.activity.findUnique({
      where: { id: input.activityId }
    });

    if (!activity) {
      throw new ApiError(404, "Activity not found");
    }

    const carbonEmission = Number((activity.carbonValue * input.quantity).toFixed(2));

    const userActivity = await prisma.userActivity.create({
      data: {
        userId: req.user!.id,
        activityId: activity.id,
        customInput: {
          ...input.customInput,
          quantity: input.quantity,
          description: input.description ?? activity.description
        },
        carbonEmission
      },
      include: {
        activity: true
      }
    });

    await awardBadgesForUser(req.user!.id);

    res.status(201).json({ userActivity });
  })
);

router.post(
  "/log-batch",
  asyncHandler(async (req, res) => {
    const input = batchLogActivitySchema.parse(req.body);

    const activityIds = [...new Set(input.entries.map((entry) => entry.activityId))];
    const catalog = await prisma.activity.findMany({
      where: {
        id: {
          in: activityIds
        }
      }
    });

    const activityById = new Map(catalog.map((activity) => [activity.id, activity]));

    for (const entry of input.entries) {
      if (!activityById.has(entry.activityId)) {
        throw new ApiError(404, "One or more activities were not found");
      }
    }

    const created = await prisma.$transaction(
      input.entries.map((entry) => {
        const activity = activityById.get(entry.activityId)!;
        const carbonEmission = Number((activity.carbonValue * entry.quantity).toFixed(2));

        return prisma.userActivity.create({
          data: {
            userId: req.user!.id,
            activityId: activity.id,
            customInput: {
              ...entry.customInput,
              quantity: entry.quantity,
              description: entry.description ?? activity.description
            },
            carbonEmission
          },
          include: {
            activity: true
          }
        });
      })
    );

    await awardBadgesForUser(req.user!.id);

    res.status(201).json({
      count: created.length,
      userActivities: created
    });
  })
);

router.get(
  "/history",
  asyncHandler(async (req, res) => {
    const history = await prisma.userActivity.findMany({
      where: { userId: req.user!.id },
      include: { activity: true },
      orderBy: { createdAt: "desc" }
    });

    res.json({ history });
  })
);

router.get(
  "/catalog",
  asyncHandler(async (_req, res) => {
    const activities = await prisma.activity.findMany({
      orderBy: [{ type: "asc" }, { description: "asc" }]
    });

    res.json({ activities });
  })
);

export default router;
