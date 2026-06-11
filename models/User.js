import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { adminDb } from "../config/db.js";

/**
 * User Schema
 * Stores all multi-step registration data in a single collection.
 *
 * Step 1: Company Info (companyName, ownerName, gstNo, website)
 * Step 2: Address Info (address, country, state, city, pincode)
 * Step 3: Contact & Auth (description, phone, email, password)
 * Step 4: Reserved for future features (roles, subscriptions, etc.)
 */
const userSchema = new mongoose.Schema(
  {
    // ── Step 1: Company Information ──────────────────────────
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
    },
    gstNo: {
      type: String,
      required: [true, "GST number is required"],
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Step 2: Address Information ──────────────────────────
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
    },

    // ── Step 3: Contact & Authentication ─────────────────────
    description: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password in queries by default
    },

    // ── Step 4: Plan Selection ─────────────────────────────────
    selectedPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      default: null,
    },

    // ── Step 5: Future Features (placeholders) ───────────────
    role: {
      type: String,
      enum: ["user", "admin", "superadmin", "management"],
      default: "user",
    },
    subscription: {
      type: String,
      enum: ["free", "basic", "premium", "enterprise"],
      default: "free",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["Active", "Suspended", "Pending"],
      default: "Active",
    },

    // ── OTP for Forgot Password ──────────────────────────────
    otp: {
      type: String,
      default: null,
      select: false, // Don't return OTP in queries by default
    },
    otpExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

/**
 * Pre-save middleware: Hash password before saving to database
 * Only runs when the password field has been modified
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance method: Compare entered password with hashed password
 * @param {string} enteredPassword - Plain text password to compare
 * @returns {boolean} - True if passwords match
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export const getAdminUserModel = () => {
  if (adminDb) {
    if (adminDb.models.User) {
      return adminDb.models.User;
    }
    return adminDb.model("User", userSchema);
  }
  return User;
};

export default User;
