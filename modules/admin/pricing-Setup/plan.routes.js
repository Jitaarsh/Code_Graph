import express from "express";
import adminProtect from "../../../middleware/adminAuth.js";
import {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  togglePlanStatus,
  deletePlan,
} from "./plan.controller.js";

const router = express.Router();

/**
 * Admin Plan Routes
 *
 * GET    /api/admin/plans          → Get all plans (including inactive)
 * POST   /api/admin/plans          → Create a new plan
 * GET    /api/admin/plans/:id      → Get a single plan
 * PUT    /api/admin/plans/:id      → Update a plan
 * PATCH  /api/admin/plans/:id/toggle → Toggle active/inactive status
 * DELETE /api/admin/plans/:id      → Delete a plan
 *
 * All routes require admin or superadmin role.
 */

// Apply admin protection to all routes in this router
router.use(adminProtect);

router.route("/").get(getAllPlans).post(createPlan);

router.route("/:id/toggle").patch(togglePlanStatus);

router.route("/:id").get(getPlanById).put(updatePlan).delete(deletePlan);

export default router;
