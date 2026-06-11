import protect from "./auth.js";

/**
 * adminProtect - Admin Authorization Middleware
 * Combines JWT authentication (protect) with role-based access control.
 * Grants access only to users with 'admin' or 'superadmin' roles.
 *
 * Usage: router.use(adminProtect) or router.get("/", ...adminProtect, handler)
 */
const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No user found.",
    });
  }

  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden. Admin access only.",
    });
  }

  next();
};

// Export as an array so it can be spread into router.use() or route handlers
const adminProtect = [protect, authorizeAdmin];

export default adminProtect;
