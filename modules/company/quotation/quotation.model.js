import mongoose from "mongoose";

/**
 * Quotation Schema
 * Stores quotations created by company users.
 * References Customer and User (createdBy).
 * Includes line items with snapshots of product data.
 */
const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: [true, "Quotation number is required"],
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        sku: { type: String, required: true },
        qty: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        productImage: { type: String, default: null },
        total: { type: Number, required: true },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discountTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    finalTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    internalNotes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Sent", "Paid", "Cancelled"],
      default: "Draft",
    },
    customerResponse: {
      status: {
        type: String,
        enum: ["Pending", "Accepted", "Rejected"],
        default: "Pending",
      },
      respondedAt: { type: Date, default: null },
      respondedByEmail: { type: String, trim: true, default: "" },
    },
    currency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP"],
      default: "INR",
    },
    /**
     * Template customisation settings saved from the "Select Quotation Template" page.
     * bgImage / wmImage are stored as base64 data-URLs (fine for small files).
     */
    templateSettings: {
      templateId: { type: String, default: "simple" },
      bgImage:    { type: String, default: null },   // base64 data-URL
      bgOpacity:  { type: Number, default: 8 },
      bgBlur:     { type: Number, default: 0 },
      bgFit:      { type: String, default: "cover" },
      bgTarget:   { type: String, default: "all" },
      wmImage:    { type: String, default: null },   // base64 data-URL
      wmOpacity:  { type: Number, default: 15 },
      wmPosition: { type: String, default: "center" },
      wmSize:     { type: Number, default: 120 },
      wmTarget:   { type: String, default: "all" },
      // Cover Page Customisation
      coverTitle: { type: String },
      coverHeader: { type: String, default: "PROJECT PROPOSAL" },
      coverDescriptionTitle: { type: String },
      coverDescription: { type: String },
      coverFooterAddress: { type: String },
      coverFooterWebsite: { type: String },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    /**
     * Snapshotted Terms and Conditions
     * Storing the content directly ensures legal consistency even if the source version is edited.
     */
    termsAndConditions: {
      versionId: { type: String },
      content: { type: String },
      sourceRef: { type: mongoose.Schema.Types.ObjectId, ref: "TermsConditions" },
    },
  },

  {
    timestamps: true,
  }
);

// Quotation numbers only need to be unique within a company account.
quotationSchema.index({ createdBy: 1, quotationNumber: 1 }, { unique: true });
quotationSchema.index({ customer: 1 });


const Quotation = mongoose.model("Quotation", quotationSchema);

export default Quotation;
