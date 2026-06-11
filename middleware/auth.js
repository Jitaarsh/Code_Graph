import jwt from "jsonwebtoken";
import User, { getAdminUserModel } from "../models/User.js";

/**
 * protect - Authentication middleware
 * Verifies the JWT token from the Authorization header
 * Attaches the authenticated user to req.user
 *
 * Usage: Add as middleware to any route that requires authentication
 * Example: router.get("/me", protect, getMe);
 */
const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      // Verify token and decode payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (exclude password)
      const AdminUser = getAdminUserModel();
      let user = await AdminUser.findById(decoded.id).select("-password");
      if (!user) {
        user = await User.findById(decoded.id).select("-password");
      }
      req.user = user;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found. Token is invalid.",
        });
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token is invalid or expired.",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No token provided.",
    });
  }
};

export default protect;
