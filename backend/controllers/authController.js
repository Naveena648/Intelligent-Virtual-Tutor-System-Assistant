import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ id: userId }, secret, { expiresIn: "7d" });
}

function sanitizeUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  };
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
    const passwordHash = await bcrypt.hash(String(password), rounds);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: passwordHash,
    });

    const token = signToken(user._id.toString());

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register user", error: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user._id.toString());

    return res.status(200).json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login", error: error.message });
  }
}

export async function getMe(req, res) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
