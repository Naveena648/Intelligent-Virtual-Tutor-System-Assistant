import { getUserById, verifyToken } from "../services/authService.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing authorization token." });
  }

  try {
    const payload = verifyToken(token);
    const user = await getUserById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "Invalid user session." });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }

  return next();
}
