// server.js
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./db");
const cors = require("cors");
const morgan = require("morgan");

dotenv.config();

const app = express();

connectDB();

// Ensure 'uploads' directory exists (basic check)
const uploadsDir = path.join(__dirname, 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created uploads directory: ${uploadsDir}`);
}

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(morgan("combined")); // More detailed logging
app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit if needed for large data

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(uploadsDir));

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/ocr", require("./routes/ocr"));

// 404 handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({ message: "The requested resource was not found." });
});

// Centralized error handler (must have 4 parameters)
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  // Check for specific Mongoose errors or other common ones if needed
  res.status(500).json({ message: "An unexpected error occurred on the server.", error: process.env.NODE_ENV === 'development' ? err.message : {} }); // Hide error details in production
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`OCR Backend Server running on http://localhost:${PORT}`));