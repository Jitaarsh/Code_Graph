import mongoose from "mongoose";

/**
 * Help Ticket Schema
 * Stores support tickets raised by company users.
 */
const helpTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: [true, "Ticket ID is required"],
      unique: true,
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["Technical", "Billing", "General"],
      required: [true, "Category is required"],
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: [true, "Priority is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    attachments: [
      {
        type: String, // URLs or paths to uploaded files
      },
    ],
    status: {
      type: String,
      enum: ["OPEN", "IN PROGRESS", "RESOLVED"],
      default: "OPEN",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        senderName: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "user"],
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }
  },
  {
    timestamps: true,
  }
);

// unique: true on ticketId already creates its index — no need for schema.index()
helpTicketSchema.index({ createdBy: 1 });

const HelpTicket = mongoose.model("HelpTicket", helpTicketSchema);

export default HelpTicket;
