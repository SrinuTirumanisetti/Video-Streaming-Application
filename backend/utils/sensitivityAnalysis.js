const Video = require('../models/Video');

const analyzeVideo = async (videoId, io) => {
  try {
    console.log(`Starting analysis for video ${videoId}`);
    
    // Simulate processing time (5-10 seconds)
    const processingTime = Math.floor(Math.random() * 5000) + 5000;
    
    setTimeout(async () => {
      const video = await Video.findById(videoId);
      if (!video) return;

      // Randomly determine status (80% safe, 20% flagged)
      // Or deterministically based on filename containing "flag"
      const isFlagged = video.filename.toLowerCase().includes('flag') || Math.random() > 0.8;
      
      video.status = isFlagged ? 'flagged' : 'safe';
      await video.save();

      console.log(`Analysis complete for video ${videoId}: ${video.status}`);

      // Emit real-time update
      io.emit('videoStatusUpdate', {
        videoId: video._id,
        status: video.status
      });

    }, processingTime);
  } catch (error) {
    console.error('Error in sensitivity analysis:', error);
  }
};

module.exports = { analyzeVideo };
