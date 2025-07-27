// routes/ocr.js - COMPLETE VERSION WITH ALL ROUTES
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload"); // Handles file uploads
const OcrTask = require("../models/OcrTask");

// Import the controller functions
const { 
  uploadOCRImage, 
  assignTask, 
  submitCorrection,
  getTaskDetail,
  getUserHistory,
  getUserStats,
  getMonthlyProgress
} = require("../controllers/ocrController");

// POST /api/ocr/upload (Protected, handles single image upload)
router.post("/upload", auth, upload.single("image"), uploadOCRImage);

// GET /api/ocr/assign (Protected)
router.get("/assign", auth, assignTask);

// POST /api/ocr/submit (Protected)
router.post("/submit", auth, submitCorrection);

// GET /api/ocr/task/:taskId (Protected) - Using controller function
router.get("/task/:taskId", auth, getTaskDetail);

// NEW HISTORY AND STATS ROUTES - ADD THESE
router.get("/history", auth, getUserHistory);
router.get("/stats", auth, getUserStats);
router.get("/progress", auth, getMonthlyProgress);

module.exports = router;
