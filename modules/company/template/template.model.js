import mongoose from "mongoose";

/**
 * Template Schema
 * Stores quotation template metadata.
 */
const templateSchema = new mongoose.Schema(
  {
    templateId: {
      type: String,
      required: [true, "Template ID is required"],
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    icon: {
      type: String,
      required: true,
      default: "FileText",
    },
    iconBg: {
      type: String,
      required: true,
      default: "bg-blue-50",
    },
    pages: {
      type: Number,
      required: true,
      default: 1,
    },
    isVertical: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// unique: true on templateId already creates its index — no need for schema.index()

const Template = mongoose.model("Template", templateSchema);

export default Template;
