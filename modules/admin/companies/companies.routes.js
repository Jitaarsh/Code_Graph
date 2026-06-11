import express from "express";
import {
  deleteCompanyById,
  getAllCompanies,
  getCompanyById,
  updateCompanyById,
} from "./companies.controller.js";
import protect from "../../../middleware/auth.js";

const router = express.Router();

// All routes are protected and require admin role
router.get("/", protect, getAllCompanies);
router.get("/:id", protect, getCompanyById);
router.put("/:id", protect, updateCompanyById);
router.delete("/:id", protect, deleteCompanyById);

export default router;
