// controllers/ocrController.js - COMPLETE VERSION WITH ALL FUNCTIONS
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const OcrTask = require('../models/OcrTask');
const { extractOdiaText } = require('../services/geminiService');

// Helper function to convert file to base64
async function fileToBase64(filePath) {
  try {
    const bitmap = await fs.readFile(filePath);
    return bitmap.toString('base64');
  } catch (err) {
    console.error('Error converting file to base64:', err);
    throw new Error('Failed to read uploaded file.');
  }
}

// Upload OCR Image
exports.uploadOCRImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded.' });
    }

    const imagePath = req.file.path;
    const imageUrl = `/uploads/${req.file.filename}`;

    // Convert image to base64 for Gemini
    const base64Image = await fileToBase64(imagePath);

    // Extract text using Gemini service
    const ocrText = await extractOdiaText(base64Image);

    // Create a new OCR task
    const newTask = new OcrTask({
      imageUrl: imageUrl,
      ocrText: ocrText,
      assignedTo: req.user.userId,
      status: 'in_progress',
      source: 'upload',
    });

    await newTask.save();

    res.status(201).json({
      message: 'Image uploaded and OCR task created successfully.',
      task: newTask,
    });
  } catch (err) {
    console.error('OCR Upload Error:', err);
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkErr) {
        console.error('Error deleting failed upload:', unlinkErr);
      }
    }
    res.status(500).json({ message: 'Failed to process image upload.', error: err.message });
  }
};

// Assign Task
exports.assignTask = async (req, res) => {
  try {
    const userId = req.user.userId;

    let task = await OcrTask.findOne({
      status: 'assigned',
      $or: [
        { assignedTo: null },
        { assignedTo: userId }
      ]
    }).sort({ createdAt: 1 });

    if (!task) {
      return res.status(404).json({ message: 'No tasks available for assignment at this time.' });
    }

    task.status = 'in_progress';
    task.assignedTo = userId;
    if (!task.source) task.source = 'system';
    await task.save();

    res.status(200).json({
      message: 'Task assigned successfully.',
      task: task,
    });
  } catch (err) {
    console.error('Assign Task Error:', err);
    res.status(500).json({ message: 'Failed to assign task.', error: err.message });
  }
};

// Get Task Detail
exports.getTaskDetail = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;
    
    console.log('Getting task:', taskId, 'for user:', userId);
    
    // Validate ObjectId format
    if (!taskId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid task ID format.' });
    }
    
    const task = await OcrTask.findOne({ 
      _id: taskId, 
      assignedTo: userId 
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found or not assigned to you.' });
    }
    
    res.status(200).json({ 
      message: 'Task retrieved successfully.',
      task: task 
    });
  } catch (err) {
    console.error('Get Task Detail Error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch task details.', 
      error: err.message 
    });
  }
};

// Submit Correction
exports.submitCorrection = async (req, res) => {
  try {
    const { taskId, correctedText } = req.body;
    const userId = req.user.userId;

    if (!taskId || correctedText === undefined) {
      return res.status(400).json({ message: 'Task ID and corrected text are required.' });
    }

    const task = await OcrTask.findOne({ _id: taskId, assignedTo: userId });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or not assigned to you.' });
    }

    task.correctedText = correctedText;
    task.status = 'submitted';
    task.submittedAt = new Date();
    await task.save();

    res.status(200).json({
      message: 'Correction submitted successfully.',
      task: task,
    });
  } catch (err) {
    console.error('Submit Correction Error:', err);
    res.status(500).json({ message: 'Failed to submit correction.', error: err.message });
  }
};

// NEW: Get User History
exports.getUserHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    console.log('Getting history for user:', userId, 'page:', page, 'status:', status);

    // Build filter object
    const filter = { assignedTo: new mongoose.Types.ObjectId(userId) };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const tasks = await OcrTask.find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('imageUrl ocrText correctedText status createdAt updatedAt submittedAt source')
      .lean();

    const total = await OcrTask.countDocuments(filter);

    console.log('Found', tasks.length, 'tasks out of', total, 'total');

    res.status(200).json({
      tasks,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    console.error('Get user history error:', err);
    res.status(500).json({ message: 'Failed to fetch user history.', error: err.message });
  }
};

// NEW: Get User Statistics (Enhanced)
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log('Getting stats for user:', userId);

    const stats = await OcrTask.aggregate([
      { $match: { assignedTo: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalAssigned: { $sum: 1 },
          totalSubmitted: {
            $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] }
          },
          totalApproved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
          },
          totalInProgress: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || { 
      totalAssigned: 0, 
      totalSubmitted: 0, 
      totalApproved: 0,
      totalInProgress: 0
    };

    // Calculate additional metrics
    const accuracyRate = result.totalSubmitted > 0 
      ? Math.round((result.totalApproved / result.totalSubmitted) * 100) 
      : 0;

    const completionRate = result.totalAssigned > 0 
      ? Math.round((result.totalSubmitted / result.totalAssigned) * 100) 
      : 0;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await OcrTask.countDocuments({
      assignedTo: new mongoose.Types.ObjectId(userId),
      updatedAt: { $gte: sevenDaysAgo }
    });

    const finalStats = {
      ...result,
      accuracyRate,
      completionRate,
      recentActivity
    };

    console.log('User stats:', finalStats);

    res.status(200).json({
      stats: finalStats
    });
  } catch (err) {
    console.error('Get user stats error:', err);
    res.status(500).json({ message: 'Failed to fetch user statistics.', error: err.message });
  }
};

// NEW: Get Monthly Progress
exports.getMonthlyProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { months = 6 } = req.query;

    console.log('Getting monthly progress for user:', userId, 'months:', months);

    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - months);

    const progress = await OcrTask.aggregate([
      {
        $match: {
          assignedTo: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: monthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalTasks: { $sum: 1 },
          submitted: {
            $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
          }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    console.log('Monthly progress:', progress);

    res.status(200).json({ progress });
  } catch (err) {
    console.error('Get monthly progress error:', err);
    res.status(500).json({ message: 'Failed to fetch monthly progress.', error: err.message });
  }
};
