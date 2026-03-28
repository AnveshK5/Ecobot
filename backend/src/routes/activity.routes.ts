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
