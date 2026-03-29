import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { getCarbonSummary } from "../services/carbon.service.js";
import { getLeaderboard, getUserLeaderboardEntry } from "../services/gamification.service.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const summary = await getCarbonSummary(req.user!.id);
    res.json(summary);
  })
);

router.get(
  "/leaderboard",
  asyncHandler(async (req, res) => {
    const leaderboard = req.user?.role === UserRole.SUPERUSER
      ? await getLeaderboard()
      : await getUserLeaderboardEntry(req.user!.id);

    res.json({
      leaderboard,
      actor: {
        id: req.user!.id,
        role: req.user!.role
      }
    });
  })
);

export default router;
