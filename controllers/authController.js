import User, { getAdminUserModel } from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../Mail_sender/sendEmail.js";

/**
 * @desc    Register a new user (multi-step form data)
 * @route   POST /api/auth/register
 * @access  Public
 *
 * Expects all fields from the multi-step registration form:
 * Step 1: companyName, ownerName, gstNo, website
 * Step 2: address, country, state, city, pincode
 * Step 3: description, phone, email, password
 */
export const registerUser = async (req, res, next) => {
  try {
    // Log body for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("📝 Register Request Body:", req.body);
    }

    const {
      // Step 1
      companyName,
      ownerName,
      gstNo,
      website,
      // Step 2
      address,
      country,
      state,
      city,
      pincode,
      // Step 3
      description,
      phone,
      email,
      password,
      // Step 4
      selectedPlan,
    } = req.body;

    // Check if user already exists with this email in either database
    const AdminUser = getAdminUserModel();
    const existingAdmin = await AdminUser.findOne({ email });
    const existingUser = await User.findOne({ email });

    if (existingAdmin || existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // Create user with all multi-step data
    const user = await User.create({
      companyName,
      ownerName,
      gstNo,
      website,
      address,
      country,
      state,
      city,
      pincode,
      description,
      phone,
      email,
      password,
      selectedPlan: selectedPlan || null,
    });

    // Generate JWT token (Explicitly convert _id to string)
    const token = generateToken(user._id.toString());

    // Return success response (user object sanitized via toObject or custom map)
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        _id: user._id,
        companyName: user.companyName,
        ownerName: user.ownerName,
        email: user.email,
        phone: user.phone,
        gstNo: user.gstNo,
        website: user.website,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        country: user.country,
        role: user.role,
        subscription: user.subscription,
        status: user.status,
      },
      token,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("🔴 Registration Controller Error:", error);
    }
    next(error);
  }
};

/**
 * @desc    Login an existing user
 * @route   POST /api/auth/login
 * @access  Public
 *
 * Expects: email, password
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user in admin database first
    const AdminUser = getAdminUserModel();
    let user = await AdminUser.findOne({ email }).select("+password");
    let isAdminDbUser = false;

    if (user && ["superadmin", "admin", "management"].includes(user.role)) {
      isAdminDbUser = true;
    } else {
      // Look in the company (quickquote) database
      user = await User.findOne({ email }).select("+password");
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: user._id,
        companyName: user.companyName,
        ownerName: user.ownerName,
        email: user.email,
        phone: user.phone,
        gstNo: user.gstNo,
        website: user.website,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        country: user.country,
        role: user.role,
        subscription: user.subscription,
        status: user.status,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in user's profile
 * @route   GET /api/auth/me
 * @access  Private (requires auth token)
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    const AdminUser = getAdminUserModel();
    let user = await AdminUser.findById(req.user._id);
    if (!user) {
      user = await User.findById(req.user._id);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user's profile
 * @route   PUT /api/auth/profile
 * @access  Private (requires auth token)
 *
 * Allows users to update their company profile information.
 * Excludes email and password from this endpoint for security.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const {
      companyName,
      ownerName,
      gstNo,
      website,
      address,
      country,
      state,
      city,
      pincode,
      description,
      phone,
    } = req.body;

    // Find the current user first to get existing values for missing fields
    const AdminUser = getAdminUserModel();
    let user = await AdminUser.findById(req.user._id);
    if (!user) {
      user = await User.findById(req.user._id);
    }
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update only the fields that are provided in the request body
    if (companyName !== undefined) user.companyName = companyName.trim();
    if (ownerName !== undefined) user.ownerName = ownerName.trim();
    if (gstNo !== undefined) user.gstNo = gstNo?.trim() || "";
    if (website !== undefined) user.website = website?.trim() || "";
    if (address !== undefined) user.address = address?.trim() || "";
    if (country !== undefined) user.country = country?.trim() || "";
    if (state !== undefined) user.state = state?.trim() || "";
    if (city !== undefined) user.city = city?.trim() || "";
    if (pincode !== undefined) user.pincode = pincode?.trim() || "";
    if (description !== undefined) user.description = description?.trim() || "";
    if (phone !== undefined) user.phone = phone.trim();

    // Validate required fields (only if they are being updated or already exist)
    const errors = [];
    if (!user.companyName?.trim()) errors.push({ field: "companyName", message: "Company name is required" });
    if (!user.ownerName?.trim()) errors.push({ field: "ownerName", message: "Owner name is required" });
    if (!user.phone?.trim()) errors.push({ field: "phone", message: "Phone number is required" });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please fix the highlighted errors",
        errors,
      });
    }

    await user.save();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/auth/change-password
 * @access  Private (requires auth token)
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new passwords",
      });
    }

    // Find user and include password
    const AdminUser = getAdminUserModel();
    let user = await AdminUser.findById(req.user._id).select("+password");
    if (!user) {
      user = await User.findById(req.user._id).select("+password");
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect current password",
      });
    }

    // Set new password and save (triggers hashing middleware)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send OTP to user's email for password reset
 * @route   POST /api/auth/forgot-password/send-otp
 * @access  Public
 */
export const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email address",
      });
    }

    // Find user in both admin and regular databases
    const AdminUser = getAdminUserModel();
    let user = await AdminUser.findOne({ email });
    let isAdminDbUser = false;

    if (user && ["superadmin", "admin", "management"].includes(user.role)) {
      isAdminDbUser = true;
    } else {
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email not found",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP to user
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    try {
      await sendEmail({
        to: email,
        subject: "Password Reset OTP - QuickQuote CRM",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a2b4b; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              You requested to reset your password. Use the OTP below to proceed:
            </p>
            <div style="background-color: #f0f4ff; border: 2px solid #145be9; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #145be9; margin: 0;">
                ${otp}
              </p>
            </div>
            <p style="color: #888; font-size: 12px;">
              <strong>⏰ This OTP expires in 10 minutes</strong>
            </p>
            <p style="color: #555; font-size: 14px; margin-top: 20px;">
              If you did not request a password reset, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">
              QuickQuote CRM Team
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent to your email successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP for password reset
 * @route   POST /api/auth/forgot-password/verify-otp
 * @access  Public
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and OTP",
      });
    }

    // Find user in both databases
    const AdminUser = getAdminUserModel();
    let user = await AdminUser.findOne({ email }).select("+otp");
    let isAdminDbUser = false;

    if (user && ["superadmin", "admin", "management"].includes(user.role)) {
      isAdminDbUser = true;
    } else {
      user = await User.findOne({ email }).select("+otp");
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email not found",
      });
    }

    // Check if OTP exists and hasn't expired
    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found. Please request a new OTP.",
      });
    }

    if (new Date() > user.otpExpires) {
      user.otp = null;
      user.otpExpires = null;
      await user.save();
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // OTP is valid - clear it and mark for password reset
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now reset your password.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password after OTP verification
 * @route   POST /api/auth/forgot-password/reset
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Find user in both databases
    const AdminUser = getAdminUserModel();
    let user = await AdminUser.findOne({ email });
    let isAdminDbUser = false;

    if (user && ["superadmin", "admin", "management"].includes(user.role)) {
      isAdminDbUser = true;
    } else {
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email not found",
      });
    }

    // Update password (triggers hashing middleware)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    next(error);
  }
};
