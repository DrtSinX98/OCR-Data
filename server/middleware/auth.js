// middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Extract token from Authorization header (format: "Bearer <token>")
  const token = req.headers.authorization?.split(" ")[1];

  // If no token found, deny access
  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  // Check if JWT_SECRET is configured
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined in environment variables");
    return res.status(500).json({ error: "Internal server configuration error." });
  }

  try {
    // Verify token using the secret key
    // If valid, jwt.verify returns the decoded payload (containing userId)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user info to req object
    next(); // Proceed to the next middleware/route handler
  } catch (err) {
    // If verification fails (invalid/expired token), deny access
    console.error("JWT Verification Error:", err.message); // Log for debugging
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token has expired." });
    }
    return res.status(401).json({ error: "Invalid or malformed token." });
  }
};