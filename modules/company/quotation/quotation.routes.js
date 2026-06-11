import express from "express";
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  getSharedQuotation,
  downloadSharedQuotation,
  respondToSharedQuotation,
  shareQuotations,
  updateQuotation,
  updateTemplateSettings,
} from "./quotation.controller.js";
import protect from "../../../middleware/auth.js";

const router = express.Router();

router.get("/public/:id", getSharedQuotation);
router.post("/public/:id/respond", respondToSharedQuotation);
router.get("/:id/download", downloadSharedQuotation);
router.get("/:id/respond/:action", respondToSharedQuotation);

// All routes are protected by auth middleware
router.use(protect);

/**
 * Quotation Routes
 * POST  /api/company/quotation            - Create a new quotation
 * GET   /api/company/quotation            - Get all quotations
 * GET   /api/company/quotation/:id        - Get a single quotation
 * PUT   /api/company/quotation/:id        - Update a quotation
 * PATCH /api/company/quotation/:id/template - Save template settings only
 */

router.post("/", createQuotation);
router.post("/share", shareQuotations);
router.get("/", getQuotations);
router.get("/:id", getQuotationById);
router.put("/:id", updateQuotation);
router.patch("/:id/template", updateTemplateSettings);

export default router;

