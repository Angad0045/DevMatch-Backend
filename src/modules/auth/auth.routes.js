import { Router } from "express";
import { validateRegister, validateLogin } from "./auth.validator.js";
import { register, login, refresh, logout } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

// Public routes
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/refresh", refresh);

// Protected — must be logged in to log out (ensures req.user exists for logoutUser)
router.post("/logout", authenticate, logout);

export default router;
