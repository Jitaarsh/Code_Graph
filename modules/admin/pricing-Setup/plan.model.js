import mongoose from "mongoose";

/**
 * Plan Schema (Admin Module)
 * Full-featured subscription plan model for admin management.
 * Covers all fields collected by the PricingSetup UI form.
 *
 * Referenced by User.selectedPlan for subscription tracking.
 */
const planSchema = new mongoose.Schema(
  {
    // ── Core Identity ─────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
    },

    shortDescription: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Pricing ───────────────────────────────────────────────
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "INR"],
      default: "USD",
    },

    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Computed field — stored for quick reads (price after discount)
    discountedPrice: {
      type: Number,
      default: null,
    },

    // ── Features / Benefits ───────────────────────────────────
    features: {
      type: [String],
      default: [],
    },

    // ── Status & Display ──────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook: auto-compute discountedPrice from price & discountPercent
 */
planSchema.pre("save", async function () {
  if (this.discountPercent > 0) {
    this.discountedPrice = parseFloat(
      (this.price * (1 - this.discountPercent / 100)).toFixed(2)
    );
  } else {
    this.discountedPrice = null;
  }
});

const Plan = mongoose.model("Plan", planSchema);

export default Plan;
