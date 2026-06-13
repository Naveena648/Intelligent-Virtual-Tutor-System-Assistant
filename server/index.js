import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import express from "express";
import dotenv from "dotenv";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";

dotenv.config();

const port = Number(process.env.PORT || 5000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "..", "dist");
const indexPath = path.join(distPath, "index.html");

if (fs.existsSync(indexPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.includes(".")) {
      return res.sendFile(indexPath);
    }

    return next();
  });
}

async function startServer() {
  try {
    await connectDatabase();
    app.listen(port, () => {
      console.log(`Tutor API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
