import express from "express";
import { getTemplates, createTemplate } from "./template.controller.js";
import protect from "../../../middleware/auth.js";

const router = express.Router();

/**
 * Template Routes
 * GET  /api/company/template - Fetch all templates
 * POST /api/company/template - Create a template (Admin/Internal)
 */

router.get("/", protect, getTemplates);
router.post("/", protect, createTemplate);

export default router;
