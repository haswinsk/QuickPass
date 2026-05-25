import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png'
]);

// Configure multer for memory storage with size limit
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
  }
});

const handleSingleUpload = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) {
      return next(error);
    }

    return next();
  });
};

// Upload file to Cloudinary
router.post('/', auth, handleSingleUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'campus-quickpass',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

router.use((error, req, res, next) => {
  if (!error) {
    return next();
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'File too large. Please upload a file under 50MB.' });
    }

    return res.status(400).json({ message: error.message });
  }

  if (error.message?.includes('Invalid file type')) {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: 'Upload failed', error: error.message });
});

// Delete file from Cloudinary
router.delete('/:publicId', auth, async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
});

export default router;
