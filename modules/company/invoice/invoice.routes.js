import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  updateTemplateSettings,
  deleteInvoice,
} from "./invoice.controller.js";
import protect from "../../../middleware/auth.js";

const router = express.Router();

// All routes are protected by auth middleware
router.use(protect);

/**
 * Invoice Routes
 * POST  /api/company/invoice            - Create a new invoice
 * GET   /api/company/invoice            - Get all invoices
 * GET   /api/company/invoice/:id        - Get a single invoice
 * PUT   /api/company/invoice/:id        - Update an invoice
 * PATCH /api/company/invoice/:id/template - Save template settings only
 * DELETE /api/company/invoice/:id       - Delete an invoice
 */

router.post("/", createInvoice);
router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.put("/:id", updateInvoice);
router.patch("/:id/template", updateTemplateSettings);
router.delete("/:id", deleteInvoice);

export default router;
