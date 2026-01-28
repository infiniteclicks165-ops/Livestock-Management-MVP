const jwt = require("jsonwebtoken")

/**
 * Generate a JWT token for a user
 * @param {string} userId - User ID to encode in token
 * @returns {string} JWT token
 */
exports.generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" })
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    throw new Error("Invalid or expired token")
  }
}

/**
 * Extract token from request (cookies or Authorization header)
 * @param {object} req - Express request object
 * @returns {string|null} Token or null if not found
 */
exports.extractToken = (req) => {
  // Check cookie first
  if (req.cookies && req.cookies.token) {
    return req.cookies.token
  }

  // Check Authorization header
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  return null
}
