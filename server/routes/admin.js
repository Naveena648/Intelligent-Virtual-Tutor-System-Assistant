import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { buildAnalytics } from "../services/analyticsService.js";

const router = Router();

router.get("/analytics", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    res.json(await buildAnalytics());
  } catch (error) {
    next(error);
  }
});

export default router;
