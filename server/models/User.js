import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    language: {
      type: String,
      default: "en",
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    collection: "users",
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
