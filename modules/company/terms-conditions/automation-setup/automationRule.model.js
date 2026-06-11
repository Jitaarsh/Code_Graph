import mongoose from "mongoose";

/**
 * Automation Rule Schema
 * Defines the logic to automatically apply specific T&C versions to quotations.
 */
const automationRuleSchema = new mongoose.Schema(
  {
    triggerType: {
      type: String,
      enum: ["product_category", "quantity", "region"],
      required: [true, "Trigger type is required"],
    },
    triggerValue: {
      type: String,
      required: [true, "Trigger value is required"],
      trim: true,
    },
    tcVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TermsConditions",
      required: [true, "Target T&C version is required"],
    },
    status: {
      type: String,
      enum: ["Active", "Disabled"],
      default: "Active",
    },
    priority: {
      type: Number,
      default: 0, // Higher number = higher priority
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

// Ensure rules are fast to lookup
automationRuleSchema.index({ createdBy: 1 });
automationRuleSchema.index({ triggerType: 1 });

const AutomationRule = mongoose.model("AutomationRule", automationRuleSchema);

export default AutomationRule;
