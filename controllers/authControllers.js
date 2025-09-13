import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import HttpError from "../helpers/HttpError.js";
import { findUserByEmail, createUser, saveUserToken, clearUserToken } from "../services/usersServices.js";

const { JWT_SECRET = "dev-secret", JWT_EXPIRES = "23h" } = process.env;

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await createUser({ email, passwordHash });

    return res.status(201).json({
      user: {
        email: user.email,
        subscription: user.subscription,
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
