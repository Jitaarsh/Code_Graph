import express from "express";
import { 
  getProfileSettings, 
  upsertProfileSettings 
} from "./profileSettings.controller.js";
import protect from "../../../middleware/auth.js";

const router = express.Router();

/**
 * @route   /api/company/profile-settings
 * @desc    Company profile configuration endpoints
 * Protected by authentication middleware
 */

// Combined GET and PUT on the root path
router
  .route("/")
  .get(protect, getProfileSettings)
  .put(protect, upsertProfileSettings);

export default router;
