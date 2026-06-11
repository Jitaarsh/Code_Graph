import express from "express";
import { 
  getInquiries, 
  createInquiry, 
  bulkCreateInquiries, 
  updateInquiryStatus, 
  deleteInquiry,
  fetchExternalInquiries 
} from "./inquiry.controller.js";
import protect from "../../../middleware/auth.js";

const router = express.Router();

// All routes are protected
router.use(protect);

router.route("/")
  .get(getInquiries)
  .post(createInquiry);

router.post("/bulk", bulkCreateInquiries);
router.post("/fetch-external", fetchExternalInquiries);

router.route("/:id")
  .patch(updateInquiryStatus)
  .delete(deleteInquiry);

export default router;
