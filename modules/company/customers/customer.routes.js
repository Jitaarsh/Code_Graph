import express from "express";
import protect from "../../../middleware/auth.js";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  bulkCreateCustomers,
  previewCustomersFromApi,
  importCustomersFromApi,
} from "./customer.controller.js";

const router = express.Router();

/**
 * Customer Routes (Company Module)
 *
 * POST   /api/company/customers       → Create a new customer
 * POST   /api/company/customers/bulk  → Bulk create customers
 * GET    /api/company/customers       → Get all customers (scoped to user)
 * GET    /api/company/customers/:id   → Get a single customer
 * PUT    /api/company/customers/:id   → Update a customer
 * DELETE /api/company/customers/:id   → Delete a customer
 *
 * All routes are protected and require authentication.
 */

// All routes require authentication
router.use(protect);

router.route("/").post(createCustomer).get(getCustomers);
router.route("/bulk").post(bulkCreateCustomers);
router.route("/integrations/preview").post(previewCustomersFromApi);
router.route("/integrations/import").post(importCustomersFromApi);

router.route("/:id").get(getCustomerById).put(updateCustomer).delete(deleteCustomer);

export default router;
