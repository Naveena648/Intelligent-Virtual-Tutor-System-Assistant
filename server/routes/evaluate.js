import { Router } from "express";
import { z } from "zod";
import { evaluateExplanation } from "../services/explainService.js";

const router = Router();

const evaluateSchema = z.object({
  question: z.string().min(2),
  referenceAnswer: z.string().min(2),
  explanation: z.string().min(2),
  domain: z.string().optional().default("Education"),
});

router.post("/", async (req, res, next) => {
  try {
    const payload = evaluateSchema.parse(req.body);
    res.json(evaluateExplanation(payload));
  } catch (error) {
    next(error);
  }
});

export default router;
