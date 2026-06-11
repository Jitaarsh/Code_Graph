import mongoose from "mongoose";

/**
 * TermsConditions Schema
 * Stores versioned Terms & Conditions created by company users.
 */
const termsConditionsSchema = new mongoose.Schema(
  {
    // ── Identity ────────────────────────────────────────────────
    versionLabel: {
      type: String,
      required: [true, "Version label is required"],
      trim: true,
    },

    // Auto-generated version ID (e.g. TC-0001)
    // sparse: true allows multiple null values without unique-key conflicts
    versionId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Rich-text HTML content from the editor
    content: {
      type: String,
      required: [true, "Terms content is required"],
    },

    // ── Status ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "draft",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    isReadOnly: {
      type: Boolean,
      default: false,
    },

    // ── Automation Rules ─────────────────────────────────────────
    automationRules: [
      {
        trigger: {
          type: String,
          enum: ["product", "quantity", "region"],
          required: true,
        },
        condition: {
          type: String,
          required: true,
          trim: true,
        },
        enabled: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // ── Ownership ────────────────────────────────────────────────
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

// ── Auto-increment versionId before save ────────────────────────
// In Mongoose 6+, async pre-hooks resolve on return and reject on throw.
// Do NOT declare or call `next` — it won't be injected for async hooks.
termsConditionsSchema.pre("save", async function () {
  if (this.isNew && !this.versionId) {
    const count = await this.constructor.countDocuments();
    this.versionId = `TC-${String(count + 1).padStart(4, "0")}`;
  }
});


const TermsConditions = mongoose.model(
  "TermsConditions",
  termsConditionsSchema
);

export default TermsConditions;

