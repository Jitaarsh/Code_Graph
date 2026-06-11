import jwt from "jsonwebtoken";

/**
 * generateToken - Creates a signed JWT token
 * @param {string} id - The user's MongoDB _id
 * @returns {string} - Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

export default generateToken;
