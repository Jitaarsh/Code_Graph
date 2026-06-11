import { body, validationResult } from "express-validator";

/**
 * Registration validation rules
 * Validates all fields from the multi-step registration form
 */
export const registerValidation = [
  // ── Step 1: Company Information ──────────────────────────
  body("companyName")
    .trim()
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters"),

  body("ownerName")
    .trim()
    .notEmpty()
    .withMessage("Owner name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Owner name must be between 2 and 100 characters"),

  body("gstNo")
    .trim()
    .notEmpty()
    .withMessage("GST number is required")
    .isLength({ min: 15, max: 15 })
    .withMessage("GST number must be exactly 15 characters"),

  body("website")
    .optional({ values: "falsy" })
    .trim()
    .isURL()
    .withMessage("Please enter a valid website URL"),

  // ── Step 2: Address Information ──────────────────────────
  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 5, max: 500 })
    .withMessage("Address must be between 5 and 500 characters"),

  body("country")
    .trim()
    .notEmpty()
    .withMessage("Country is required"),

  body("state")
    .trim()
    .notEmpty()
    .withMessage("State is required"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),

  body("pincode")
    .trim()
    .notEmpty()
    .withMessage("Pincode is required")
    .isLength({ min: 4, max: 10 })
    .withMessage("Pincode must be between 4 and 10 characters"),

  // ── Step 3: Contact & Authentication ─────────────────────
  body("description")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be under 1000 characters"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[+]?[\d\s-]{7,15}$/)
    .withMessage("Please enter a valid phone number"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
];

/**
 * Login validation rules
 */
export const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];


/**
 * handleValidationErrors - Middleware to check for validation errors
 * Must be used AFTER the validation rules in the route chain
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    if (process.env.NODE_ENV === "development") {
      console.log("🟡 Validation Errors:", errors.array());
    }
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};
