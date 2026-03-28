import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getCarbonSummary } from "../services/carbon.service.js";
import { getLeaderboard } from "../services/gamification.service.js";
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
  asyncHandler(async (_req, res) => {
    const leaderboard = await getLeaderboard();
    res.json({ leaderboard });
  })
);

export default router;
