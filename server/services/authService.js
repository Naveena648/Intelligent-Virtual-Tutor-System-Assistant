import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const jwtSecret = process.env.JWT_SECRET || "lumina-dev-secret";

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    jwtSecret,
    { expiresIn: "7d" },
  );
}

export async function signUp({ name, email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const trimmedName = String(name).trim();
  const emailPrefix = normalizedEmail.split("@")[0].replace(/[^a-z0-9._-]/gi, "").toLowerCase() || "user";
  const generatedUsername = `${emailPrefix}_${Date.now()}`;

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("An account with this email already exists.");
    error.status = 409;
    throw error;
  }

  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  const passwordHash = await bcrypt.hash(password, rounds);
  const user = await User.create({
    username: generatedUsername,
    name: trimmedName,
    email: normalizedEmail,
    passwordHash,
    role: "user",
    language: "en",
  });

  return {
    user: sanitizeUser(user),
    token: signToken(user),
  };
}

export async function signIn({ email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  return {
    user: sanitizeUser(user),
    token: signToken(user),
  };
}

export async function getUserById(userId) {
  const user = await User.findById(userId);
  return user ? sanitizeUser(user) : null;
}

export function sanitizeUser(user) {
  const raw = typeof user.toObject === "function" ? user.toObject() : user;
  const sanitizedUser = {
    ...raw,
    id: String(raw._id || raw.id),
  };
  delete sanitizedUser._id;
  delete sanitizedUser.__v;
  delete sanitizedUser.passwordHash;
  return sanitizedUser;
}

export function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}
