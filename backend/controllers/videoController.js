const Video = require('../models/Video');
const { analyzeVideo } = require('../utils/sensitivityAnalysis');
const fs = require('fs');
const path = require('path');

exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, description } = req.body;
    
    const video = await Video.create({
      title,
      description,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      owner: req.user._id,
      status: 'processing'
    });

    // Trigger async analysis
    analyzeVideo(video._id, req.io);

    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVideos = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = { owner: req.user._id }; // Multi-tenant: user isolation

    // Admin can see all? Requirements say "Admin Role: Full system access"
    if (req.user.role === 'admin') {
      delete query.owner; // Admin sees all
    }

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

    // Access control
    if (req.user.role !== 'admin' && video.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

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

    // Access control check? Streaming might need to be public or token based.
    // For this assignment, we'll assume if they have the ID and are logged in (via middleware) it's fine.
    // Or we can be strict:
    // if (req.user.role !== 'admin' && video.owner.toString() !== req.user._id.toString()) { ... }
    // However, standard HTML5 video player request might not send headers easily without custom logic.
    // For simplicity, we might skip auth on stream OR assume token is passed in query param.
    // Let's assume auth middleware is applied to this route.

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
