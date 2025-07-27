// models/OcrTask.js
const mongoose = require("mongoose");

const ocrTaskSchema = new mongoose.Schema({
  imageUrl: String,
  ocrText: String,
  correctedText: { type: String, default: "" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: ["assigned", "in_progress", "submitted", "approved"],
    default: "assigned",
  },
  source: { type: String, enum: ["upload", "system"], required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true }); // Add updatedAt

module.exports = mongoose.model("OcrTask", ocrTaskSchema);