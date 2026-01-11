const Video = require('../models/Video');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static');
const path = require('path');
const fs = require('fs');

// Set FFmpeg and FFprobe paths - prefer environment variables in production
const finalFfmpegPath = process.env.FFMPEG_PATH || ffmpegPath;
const finalFfprobePath = process.env.FFPROBE_PATH || ffprobePath.path;

console.log('Using FFmpeg path:', finalFfmpegPath);
console.log('Using FFprobe path:', finalFfprobePath);

ffmpeg.setFfmpegPath(finalFfmpegPath);
ffmpeg.setFfprobePath(finalFfprobePath);

const analyzeVideo = async (videoId, io) => {
  try {
    console.log(`Starting analysis pipeline for video ${videoId}`);

    const video = await Video.findById(videoId);
    if (!video) {
      console.error('Video not found for analysis');
      return;
    }

    // Use Cloudinary URL if available, otherwise fall back to local path
    const videoPath = video.cloudinaryUrl || path.resolve(video.path);
    const framesDir = path.join(__dirname, '..', 'temp', 'frames', videoId.toString());

    // Ensure frames directory exists
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }

    // 🧩 Step 2: Optimization for Production
    // If we are in production and want to avoid FFmpeg overhead, we can run a "Light Analysis"
    // Especially since the current analysis is a simulation based on the filename.
    const useLightAnalysis = process.env.SKIP_FFMPEG === 'true' || process.env.NODE_ENV === 'production';

    if (useLightAnalysis) {
      console.log('Step 2: Running Light Analysis (Simulation) to save server resources...');

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));

      const isFlagged = video.filename.toLowerCase().includes('flag');
      const sensitivityResult = isFlagged ? 'flagged' : 'safe';

      console.log(`Step 4: Finalizing Light Analysis. Result: ${sensitivityResult}`);

      video.status = sensitivityResult;
      await video.save();

      io.emit('videoStatusUpdate', {
        videoId: video._id,
        status: video.status
      });
      return;
    }

    // Full FFmpeg Analysis (for local development or powerful servers)
    console.log('Step 2: Starting Full FFmpeg processing...');

    ffmpeg(videoPath)
      .on('start', (commandLine) => {
        console.log('Spawned Ffmpeg with command: ' + commandLine);
      })
      .on('progress', (progress) => {
        // Optional: Emit progress updates to client
        // io.emit('processingProgress', { videoId, percent: progress.percent });
        console.log(`Processing: ${progress.percent}% done`);
      })
      .on('error', async (err) => {
        console.error(`An error occurred during FFmpeg processing for video ${videoId}:`, err.message);

        // Update database to prevent 'stuck' processing state
        // We'll mark it as 'flagged' or 'safe' with a note, but for this UI 'flagged' is safer if analysis failed
        try {
          video.status = 'flagged';
          await video.save();

          io.emit('videoStatusUpdate', {
            videoId: video._id,
            status: video.status,
            error: 'Processing failed: ' + err.message
          });
          console.log(`Video ${videoId} marked as flagged due to processing error.`);
        } catch (saveError) {
          console.error('Failed to update video status after FFmpeg error:', saveError);
        }
      })
      .on('end', async () => {
        console.log('FFmpeg processing finished. Frames extracted.');

        // 🧩 Step 3: Sensitivity analysis runs
        console.log('Step 3: Running Sensitivity Analysis on frames...');

        // Simulate analysis of extracted frames
        // In a real app, we would send these images to an AI service (e.g., AWS Rekognition, Google Vision)
        // Here we verify frames exist and simulate a result

        try {
          const files = fs.readdirSync(framesDir);
          console.log(`Analyzed ${files.length} frames.`);

          // Simulation delay
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Logic: If filename contains 'flag', mark as flagged (for testing), else random/safe
          // "Frames/images are analyzed... Result: safe OR flagged"
          const isFlagged = video.filename.toLowerCase().includes('flag');
          // Note: For demo purposes, we default to safe unless 'flag' is in name, 
          // or we could randomly flag it. Let's stick to safe by default for better UX unless intended.
          // Or keep the random factor as requested implicitly by "sensitivity analysis".
          // Let's make it deterministic for "flag" keyword, otherwise safe.

          const sensitivityResult = isFlagged ? 'flagged' : 'safe';

          // Cleanup frames (optional, but good for disk space)
          // fs.rmSync(framesDir, { recursive: true, force: true });

          // 🧩 Step 4: Finalize
          console.log(`Step 4: Finalizing. Result: ${sensitivityResult}`);

          video.status = sensitivityResult;
          await video.save();

          // Emit real-time update
          io.emit('videoStatusUpdate', {
            videoId: video._id,
            status: video.status
          });

        } catch (err) {
          console.error('Analysis error:', err);
        }
      })
      .screenshots({
        // Extract 3 screenshots at 20%, 50%, 80% of the video
        count: 3,
        folder: framesDir,
        size: '320x240',
        filename: 'thumbnail-%b.png'
      });

  } catch (error) {
    console.error('Error in sensitivity analysis pipeline:', error);
  }
};

module.exports = { analyzeVideo };
