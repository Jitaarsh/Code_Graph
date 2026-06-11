import express from "express";
import {
  getAllTickets,
  updateTicketStatus,
  getTicketById,
  sendSystemRequestOtp,
  systemRequestLogin,
} from "./ticket.controller.js";
import adminProtect from "../../../middleware/adminAuth.js";

const router = express.Router();

// All routes are protected and admin-only
router.use(...adminProtect);

router.route("/")
  .get(getAllTickets);

router.route("/:id")
  .get(getTicketById);

router.route("/:id/system-request-otp")
  .post(sendSystemRequestOtp);

router.route("/:id/system-request-login")
  .post(systemRequestLogin);

router.route("/:id/status")
  .patch(updateTicketStatus);

export default router;
