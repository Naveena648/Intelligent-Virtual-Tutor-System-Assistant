import { Router } from "express";
import { z } from "zod";
import { getUserById, signIn, signUp } from "../services/authService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const authSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/signup", async (req, res, next) => {
  try {
    const payload = authSchema.parse(req.body);
    const result = await signUp(payload);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const payload = authSchema.pick({ email: true, password: true }).parse(req.body);
    const result = await signIn(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
