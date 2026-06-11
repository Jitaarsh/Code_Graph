import express from "express";
import protect from "../../../middleware/auth.js";
import {
  createTerms,
  getAllTerms,
  getTermsById,
  updateTerms,
  deleteTerms,
  setActiveTerms,
} from "./termsConditions.controller.js";
import automationRoutes from "./automation-setup/automation.routes.js";


const router = express.Router();

/**
 * Terms & Conditions Routes (Company Module)
 *
 * POST   /api/company/terms-conditions           → Create new version
 * GET    /api/company/terms-conditions           → Get all versions (scoped to user)
 * GET    /api/company/terms-conditions/:id       → Get single version
 * PUT    /api/company/terms-conditions/:id       → Update version
 * DELETE /api/company/terms-conditions/:id       → Delete version
 * PATCH  /api/company/terms-conditions/:id/set-active → Set as active version
 *
 * All routes require authentication.
 */
router.use(protect);

router.route("/").post(createTerms).get(getAllTerms);

// ⚠️ Automation routes MUST come before /:id — otherwise Express
// treats the string "automation" as an :id value and calls getTermsById.
router.use("/automation", automationRoutes);

router.route("/:id").get(getTermsById).put(updateTerms).delete(deleteTerms);
router.route("/:id/set-active").patch(setActiveTerms);



export default router;
