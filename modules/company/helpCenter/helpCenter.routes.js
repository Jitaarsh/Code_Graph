import express from "express";
import {
  createTicket,
  getMyTickets,
  getTicketById,
} from "./helpCenter.controller.js";
import protect from "../../../middleware/auth.js";
import upload from "../../../middleware/upload.js";

const router = express.Router();

// All routes are protected
router.use(protect);

router.route("/")
  .post(upload.array("attachments", 5), createTicket) // Allow up to 5 files
  .get(getMyTickets);

router.route("/:id")
  .get(getTicketById);

export default router;
