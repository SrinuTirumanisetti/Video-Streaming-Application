const Video = require('../models/Video');
const { analyzeVideo } = require('../utils/sensitivityAnalysis');
const fs = require('fs');
const path = require('path');

exports.uploadVideo = async (req, res) => {
  console.log('Starting uploadVideo controller...');
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);
  console.log('req.user:', req.user);

  try {
    if (!req.file) {
      console.log('No file found in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, description } = req.body;

    console.log('Finalizing video creation with data:', {
      title: title || req.file.originalname,
      filename: req.file.filename || req.file.public_id || req.file.originalname,
      path: req.file.path || req.file.secure_url,
      size: req.file.size || req.file.bytes || 0
    });

    // Cloudinary stores the file and returns URL info
    const video = await Video.create({
      title: title || req.file.originalname,
      description: description || '',
      filename: req.file.filename || req.file.public_id || req.file.originalname,
      path: req.file.path || req.file.secure_url, // This will be the Cloudinary URL
      cloudinaryUrl: req.file.path || req.file.secure_url, // Store Cloudinary URL separately
      cloudinaryPublicId: req.file.filename || req.file.public_id, // Store public ID for management
      size: req.file.size || req.file.bytes || 0,
      mimetype: req.file.mimetype,
      owner: req.user._id,
      status: 'processing'
    });

    // Trigger async analysis - now works with Cloudinary URLs
    analyzeVideo(video._id, req.io);

    res.status(201).json(video);
  } catch (error) {
    console.error('Error during video upload:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', details: error.errors });
    }
    res.status(500).json({ message: 'Failed to upload video.', error: error.message });
  }
};

exports.getVideos = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {}; // Allow all users to see all videos

    if (status) {
      query.status = status;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const videos = await Video.find(query).sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Allow read access to everyone for now, since requirements say viewers should see videos
    // Edit/Delete protection would be separate (not implemented in this GET route)

    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.streamVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Use Cloudinary URL for streaming
    if (video.cloudinaryUrl) {
      // Redirect to Cloudinary URL - Cloudinary handles range requests automatically
      return res.redirect(video.cloudinaryUrl);
    }

    // Fallback to local file streaming (for existing videos before migration)
    const videoPath = path.resolve(video.path);
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
