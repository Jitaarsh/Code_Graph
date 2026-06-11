import express from "express";
import { registerUser, loginUser, getMe, updateProfile, changePassword, sendOtp, verifyOtp, resetPassword } from "../controllers/authController.js";
import protect from "../middleware/auth.js";
import {
  registerValidation,
  loginValidation,
  handleValidationErrors,
} from "../middleware/validate.js";

const router = express.Router();

/**
 * Auth Routes
 *
 * POST /api/auth/register         → Register a new user (public)
 * POST /api/auth/login            → Login an existing user (public)
 * GET  /api/auth/me               → Get logged-in user profile (protected)
 * PUT  /api/auth/profile          → Update user profile (protected)
 * PUT  /api/auth/change-password  → Change user password (protected)
 * POST /api/auth/forgot-password/send-otp    → Send OTP to email (public)
 * POST /api/auth/forgot-password/verify-otp  → Verify OTP (public)
 * POST /api/auth/forgot-password/reset       → Reset password (public)
 */

// Public: Register with validation
router.post("/register", registerValidation, handleValidationErrors, registerUser);

// Public: Login with validation
router.post("/login", loginValidation, handleValidationErrors, loginUser);

// Protected: Get current user
router.get("/me", protect, getMe);

// Protected: Update profile
router.put("/profile", protect, updateProfile);

// Protected: Change password
router.put("/change-password", protect, changePassword);

// Public: Forgot Password Routes
router.post("/forgot-password/send-otp", sendOtp);
router.post("/forgot-password/verify-otp", verifyOtp);
router.post("/forgot-password/reset", resetPassword);

export default router;
