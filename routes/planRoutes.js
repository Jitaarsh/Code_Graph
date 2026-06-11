import express from "express";
import { getActivePlans } from "../modules/admin/pricing-Setup/plan.controller.js";

const router = express.Router();

/**
 * Public Plan Routes
 *
 * GET /api/plans → Get only active plans (used on registration/plan selection page)
 *
 * Access: Public (no auth required)
 */
router.get("/", getActivePlans);

export default router;
