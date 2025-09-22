import gravatar from "gravatar";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import HttpError from "../helpers/HttpError.js";
import sendMail from "../helpers/mailers.js";
import { findUserByEmail, createUser, saveUserToken, clearUserToken, updateUserAvatar, findUserByVerificationToken, markUserVerified, setVerificationToken } from "../services/usersServices.js";

const { JWT_SECRET = "dev-secret", JWT_EXPIRES = "23h", BASE_URL } = process.env;

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

    const verificationToken = uuidv4();

    const user = await createUser({
      email, 
      passwordHash, 
      avatarURL,
      verify: false,
      verificationToken
    });

    const verifyLink = `${BASE_URL}/api/auth/verify/${verificationToken}`;
    await sendMail({
      to: email,
      subject: "Verify your email",
      html: `<p>Hi!</p><p>Please verify your email by clicking the link below:</p>
             <p><a href="${verifyLink}">${verifyLink}</a></p>`,
      text: `Verify your email: ${verifyLink}`,
    });

    return res.status(201).json({
      user: {
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL,
      },
    });
  } catch (e) {
    if (e.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Email in use" });
    }
    console.error("Register failed:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { verificationToken } = req.params;
    const user = await findUserByVerificationToken(verificationToken);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await markUserVerified(user.id);

    return res.status(200).json({ message: "Verification successful" });
  } catch (e) {
    console.error("Verify failed:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/verify (resend)
export const resendVerifyEmail = async (req, res) => {
  try {
    const email = String(req.body.email).trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "missing required field email" });

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.verify) {
      return res.status(400).json({ message: "Verification has already been passed" });
    }

    const token = user.verificationToken || uuidv4();
    if (!user.verificationToken) {
      await setVerificationToken(user.id, token);
    }

    const verifyLink = `${BASE_URL}/api/auth/verify/${token}`;
    await sendMail({
      to: email,
      subject: "Verify your email (resend)",
      html: `<p>Please verify your email:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`,
      text: `Verify your email: ${verifyLink}`,
    });

    return res.status(200).json({ message: "Verification email sent" });
  } catch (e) {
    console.error("Resend verify failed:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const email = String(req.body.email).trim().toLowerCase();
    const { password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    // block login until verified
    if (!user.verify) {
      return res.status(401).json({ message: "Email not verified" });
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
      user: { email: user.email, subscription: user.subscription },
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
