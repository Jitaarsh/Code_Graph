import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    projectName: {
      type: String,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    productName: {
      type: String, // Fallback or custom product name
    },
    quantity: {
      type: Number,
      default: 0,
    },
    priority: {
      type: String,
      enum: ["Medium", "High", "Urgent"],
      default: "Medium",
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["New", "In Progress", "Converted"],
      default: "New",
    },
    customFields: {
      type: Map,
      of: String,
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

const Inquiry = mongoose.model("Inquiry", inquirySchema);

export default Inquiry;
