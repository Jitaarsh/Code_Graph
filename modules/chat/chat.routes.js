import express from 'express';
import chatUpload from '../../middleware/chat-upload.js';
import protect from '../../middleware/auth.js';

const router = express.Router();

/**
 * @desc    Upload a file for chat attachment
 * @route   POST /api/chat/upload
 * @access  Private
 */
router.post('/upload', protect, chatUpload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
});

export default router;
