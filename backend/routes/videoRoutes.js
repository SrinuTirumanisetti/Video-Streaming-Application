const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadVideo, getVideos, getVideoById, streamVideo } = require('../controllers/videoController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Not a video file!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Routes
router.post('/upload', protect, authorize('editor', 'admin'), upload.single('video'), uploadVideo);
router.get('/', protect, getVideos);
router.get('/:id', protect, getVideoById);

// Stream route - Note: Auth for streaming can be tricky with standard HTML5 video tag.
// We can use a query param token if needed, but for now we'll rely on the header being sent if using custom player or fetch.
// If using standard <video src="...">, the browser sends the request. Cookies would work, but we are using JWT.
// For the sake of the assignment, I'll allow streaming to be protected but we might need a workaround on frontend.
// Alternative: Pass token in query string `?token=...` and middleware checks that too.
router.get('/stream/:id', async (req, res, next) => {
    if (req.query.token) {
        req.headers.authorization = `Bearer ${req.query.token}`;
    }
    next();
}, protect, streamVideo);

module.exports = router;
