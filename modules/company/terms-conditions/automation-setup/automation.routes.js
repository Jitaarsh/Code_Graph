import express from "express";
import {
  createRule,
  getRules,
  updateRule,
  deleteRule
} from "./automation.controller.js";
import protect from "../../../../middleware/auth.js";


const router = express.Router();

// All routes are protected and scoped to the company/user
router.use(protect);

router.post("/", createRule);
router.get("/", getRules);
router.put("/:id", updateRule);
router.delete("/:id", deleteRule);

export default router;
