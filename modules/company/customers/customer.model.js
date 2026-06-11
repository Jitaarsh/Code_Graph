import mongoose from "mongoose";

/**
 * Customer Schema
 * Stores customers created by company users from the company dashboard.
 */
const customerSchema = new mongoose.Schema(
  {
    // ── Phase 1: Primary Identity ────────────────────────────
    fullName: {
      type: String,
      required: [true, "Customer full name is required"],
      trim: true,
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
      default: "",
    },

    // ── Phase 2: Categorization & Locale ─────────────────────
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      default: "India",
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      default: "",
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: ["individual", "corporate", "wholesaler", "retailer"],
      required: [true, "Customer category is required"],
    },
    leadType: {
      type: String,
      enum: ["hot", "warm", "cold"],
      required: [true, "Lead type is required"],
    },
    assignedUser: {
      type: String,
      required: [true, "Assigned user is required"],
      trim: true,
      default: "",
    },
    currency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP"],
      required: [true, "Currency is required"],
      default: "INR",
    },

    // ── Meta ─────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
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

// Compound index: unique email per company user
customerSchema.index({ email: 1, createdBy: 1 }, { unique: true });

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
