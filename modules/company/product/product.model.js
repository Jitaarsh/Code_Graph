import mongoose from "mongoose";

/**
 * Product Schema
 * Stores products created by company users.
 * Supports pricing tiers, logistical details, and inventory management.
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, "Product SKU is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["Materials", "Services", "Consulting"],
      required: [true, "Product category is required"],
    },
    description: {
      type: String,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      default: 0,
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      trim: true,
      default: "unit",
    },
    pricingTiers: [
      {
        minQty: { type: Number, required: true },
        maxQty: { type: Number, required: true },
        price: { type: Number, required: true },
      }
    ],
    portOfImport: {
      type: String,
      trim: true,
    },
    addressDetail: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    currency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP"],
      required: [true, "Currency is required"],
      default: "INR",
    },
    productImage: {
      type: String,
      default: "",
    },
    cataloguePdf: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes to ensure unique names and SKUs per company user
productSchema.index({ name: 1, createdBy: 1 }, { unique: true });
productSchema.index({ sku: 1, createdBy: 1 }, { unique: true });

const Product = mongoose.model("Product", productSchema);

export default Product;
