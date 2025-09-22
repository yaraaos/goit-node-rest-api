import express from "express";
import { register, login, logout, getCurrent, updateAvatar, verifyEmail, resendVerifyEmail } from "../controllers/authControllers.js";
import validateBody from "../helpers/validateBody.js";
import { registerSchema, loginSchema, emailOnlySchema } from "../schemas/authSchemas.js";
import upload from "../middleware/upload.js";
import auth from "../middleware/auth.js";


const authRouter = express.Router();

authRouter.post("/register", validateBody(registerSchema), register);
authRouter.get("/verify/:verificationToken", verifyEmail);
authRouter.post("/verify", validateBody(emailOnlySchema), resendVerifyEmail);

authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/logout", auth, logout);
authRouter.get("/current", auth, getCurrent);
authRouter.patch("/avatars", auth, upload.single("avatar"), updateAvatar);


export default authRouter;
