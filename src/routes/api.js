const express = require('express');
const multer = require('multer');
const router = express.Router();

const {
  analyzeDocument,
  resummarizeText,
  getSampleDocuments
} = require('../controllers/documentController');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ];
    const originalName = file.originalname.toLowerCase();
    const isAllowedExt = /\.(pdf|png|jpe?g|webp|bmp|tiff?)$/i.test(originalName);

    if (allowedMimes.includes(file.mimetype.toLowerCase()) || isAllowedExt) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Please upload a PDF (.pdf) or image file (.png, .jpg, .jpeg, .webp, .bmp).'));
    }
  }
});

router.post('/analyze-document', (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File is too large. Maximum supported file size is 25MB.'
        });
      }
      return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
}, analyzeDocument);

router.post('/re-summarize', resummarizeText);

router.get('/sample-documents', getSampleDocuments);

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Document Summary Assistant API',
    version: '1.0.0'
  });
});

module.exports = router;
