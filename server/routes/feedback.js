import { Router } from "express";
import { z } from "zod";
import { updateState } from "../lib/fileStore.js";

const router = Router();

const feedbackSchema = z.object({
  type: z.enum(["up", "down"]),
  message: z.string().min(1),
  domain: z.string().optional(),
  userId: z.string().nullable().optional(),
});

router.post("/", async (req, res, next) => {
  try {
    const payload = feedbackSchema.parse(req.body);

    const state = await updateState(async (current) => ({
      ...current,
      feedback: [
        {
          id: crypto.randomUUID(),
          ...payload,
          createdAt: new Date().toISOString(),
        },
        ...current.feedback,
      ],
    }));

    res.status(201).json({ feedbackCount: state.feedback.length });
  } catch (error) {
    next(error);
  }
});

export default router;
