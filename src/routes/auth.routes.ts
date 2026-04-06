import { Router } from "express";
import {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  logout,
} from "../controllers/auth.controller";

const router = Router();

/**
 * @section Public Routes
 * No authentication required for these endpoints.
 */

// 1. Identity & Onboarding
router.post("/register", register);
router.post("/verify-otp", verifyOtp);

// 2. Authentication
router.post("/login", login);
router.post("/logout", logout); // While stateless, clear tokens here

// 3. Account Recovery
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
