import mongoose from "mongoose";

/**
 * Invoice Schema
 * Stores invoices created by company users.
 * References Customer and User (createdBy).
 * Includes line items with snapshots of product data, issue date, and due date.
 */
const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: [true, "Issue date is required"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
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
      enum: ["Draft", "Unpaid", "Paid", "Partially Paid", "Overdue", "Cancelled"],
      default: "Draft",
    },
    currency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP"],
      default: "INR",
    },
    companyLogo: {
      type: String,
      default: null, // base64 or URL
    },
    /**
     * Template customisation settings saved from the "Select Invoice Template" page.
     * bgImage / wmImage are stored as base64 data-URLs.
     */
    templateSettings: {
      templateId: { type: String, default: "simple" },
      bgImage:    { type: String, default: null },   // base64 data-URL
      wmImage:    { type: String, default: null },   // base64 data-URL
      wmOpacity:  { type: Number, default: 15 },
      wmPosition: { type: String, default: "center" },
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

// Invoice numbers only need to be unique within a company account.
invoiceSchema.index({ createdBy: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ customer: 1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
