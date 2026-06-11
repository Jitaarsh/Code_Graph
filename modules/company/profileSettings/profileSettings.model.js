import mongoose from "mongoose";

/**
 * ProfileSettings Schema
 * Stores company-specific configurations for document generation and branding.
 * Each document is linked to a single User (Company Admin) account.
 */
const profileSettingsSchema = new mongoose.Schema(
  {
    /**
     * @section User Association
     * link settings to a specific company owner.
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true, // One settings document per company
    },

    /**
     * @section Document Numbering Pattern
     * Controls the sequence and prefixing for generated documents.
     */
    // Sequence pattern for Invoices (e.g., INV-1001)
    invoicePrefix: {
      type: String,
      default: "INV-",
      trim: true,
    },
    invoiceStartNumber: {
      type: Number,
      default: 1001,
    },
    // Sequence pattern for Quotations (e.g., QTN-500)
    quotePrefix: {
      type: String,
      default: "QTN-",
      trim: true,
    },
    quoteStartNumber: {
      type: Number,
      default: 500,
    },

    /**
     * @section Standard Defaults
     * Global defaults automatically applied to new ledger entries.
     */
    // Default tax rate in percentage (e.g., 20 for 20%)
    defaultTaxRate: {
      type: Number,
      default: 20,
    },
    // Default validity duration in days for quotations
    validityPeriod: {
      type: Number,
      default: 30,
    },
    // Default payment terms (Select options in UI)
    paymentTerms: {
      type: String,
      default: "Net 30 - Payment due in 30 days",
      trim: true,
    },

    /**
     * @section Brand Identity
     * Visual assets and color tokens used for document styling.
     */
    // Storage paths or URLs for brand logos
    primaryLogo: {
      type: String,
      default: "",
    },
    secondaryLogo: {
      type: String,
      default: "",
    },
    // Hex code for the primary brand color
    primaryColor: {
      type: String,
      default: "#145be9",
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically track creation and updates
  }
);

const ProfileSettings = mongoose.model("ProfileSettings", profileSettingsSchema);

export default ProfileSettings;
