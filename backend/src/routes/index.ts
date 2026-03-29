import { Router } from "express";
import activityRoutes from "./activity.routes.js";
import adminRoutes from "./admin.routes.js";
import aiRoutes from "./ai.routes.js";
import authRoutes from "./auth.routes.js";
import carbonRoutes from "./carbon.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/activity", activityRoutes);
router.use("/carbon", carbonRoutes);
router.use("/ai", aiRoutes);
router.use("/admin", adminRoutes);

export default router;
