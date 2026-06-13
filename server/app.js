import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import evaluateRoutes from "./routes/evaluate.js";
import ticketRoutes from "./routes/tickets.js";
import adminRoutes from "./routes/admin.js";
import feedbackRoutes from "./routes/feedback.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Intelligent Virtual Tutor System Assistant" });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/evaluate", evaluateRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);

app.use((err, _req, res, next) => {
  void next;
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Unexpected server error.",
    details: err.errors || undefined,
  });
});

export default app;
