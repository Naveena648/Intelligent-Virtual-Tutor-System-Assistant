import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { createTicket, updateTicketStatus } from "../services/ticketService.js";
import { readState } from "../lib/fileStore.js";

const router = Router();

const ticketSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  domain: z.string().min(2),
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const state = await readState();
    const tickets = req.user.role === "admin"
      ? state.tickets
      : state.tickets.filter((ticket) => ticket.userId === req.user.id);

    res.json({ tickets });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const payload = ticketSchema.parse(req.body);
    const state = await createTicket({
      userId: req.user.id,
      ...payload,
    });
    res.status(201).json({ ticket: state.tickets[0] });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({ status: z.enum(["open", "in_progress", "resolved"]) });
    const { status } = schema.parse(req.body);
    const { id } = req.params;
    const state = await updateTicketStatus(id, status);
    const ticket = state.tickets.find((entry) => entry.id === id);

    res.json({ ticket });
  } catch (error) {
    next(error);
  }
});

export default router;
