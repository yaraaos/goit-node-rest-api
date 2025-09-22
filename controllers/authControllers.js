import gravatar from "gravatar";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import HttpError from "../helpers/HttpError.js";
import { findUserByEmail, createUser, saveUserToken, clearUserToken, updateUserAvatar } from "../services/usersServices.js";

const { JWT_SECRET = "dev-secret", JWT_EXPIRES = "23h" } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const avatarsDir = path.join(__dirname, "..", "public", "avatars");

export const register = async (req, res) => {
  try {
    const email = String(req.body.email).trim().toLowerCase();
    const { password } = req.body;

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const avatarURL = gravatar.url(email.toLowerCase().trim(), { s: "250", d: "retro" }, true);

    const user = await createUser({ email, passwordHash, avatarURL });

    return res.status(201).json({
      user: {
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL,
      },
    });
  } catch (e) {
    console.error("Register failed:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const payload = { id: user.id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    await saveUserToken(user.id, token);

    return res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (e) {
    console.error("Login failed:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res, next) => {
  try {
    const { id } = req.user; 

    if (!id) {
      return next(HttpError(401, "Not authorized"));
    }

    await clearUserToken(id);
    return res.status(204).send(); // No Content
  } catch (e) {
    next(HttpError(401, "Not authorized"));
  }
};

export const getCurrent = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.status(200).json({
      email: req.user.email,
      subscription: req.user.subscription,
    });
  } catch (e) {
    next(HttpError(401, "Not authorized"));
  }
};

export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(HttpError(401, "Not authorized"));
    if (!req.file)   return next(HttpError(400, "Avatar file is required"));

    await fs.mkdir(avatarsDir, { recursive: true });

    const ext = path.extname(req.file.originalname).toLowerCase() || ".png";
    const filename = `${req.user.id}_${Date.now()}${ext}`;
    const destPath = path.join(avatarsDir, filename);

    await fs.rename(req.file.path, destPath);

    const avatarURL = `/avatars/${filename}`;
    await updateUserAvatar(req.user.id, avatarURL);

    return res.status(200).json({ avatarURL });
  } catch (e) {

    if (req.file?.path) { try { await fs.unlink(req.file.path); } catch {} }
    return next(HttpError(401, "Not authorized"));
  }
};
