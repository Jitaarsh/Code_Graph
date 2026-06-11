import express from "express";
import protect from "../../../middleware/auth.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkCreateProducts,
} from "./product.controller.js";
import productUpload from "../../../middleware/product-upload.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post("/bulk", productUpload.any(), bulkCreateProducts);

router.route("/")
  .post(
    productUpload.fields([
      { name: "productImage", maxCount: 1 },
      { name: "cataloguePdf", maxCount: 1 },
    ]),
    createProduct
  )
  .get(getProducts);

router.route("/:id")
  .get(getProductById)
  .put(
    productUpload.fields([
      { name: "productImage", maxCount: 1 },
      { name: "cataloguePdf", maxCount: 1 },
    ]),
    updateProduct
  )
  .delete(deleteProduct);

export default router;
