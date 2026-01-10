import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ videoId, token }) => {
  const videoRef = useRef(null);
  const streamUrl = `${import.meta.env.VITE_API_URL}/videos/stream/${videoId}?token=${token}`;

  return (
    <div className="w-full max-w-4xl mx-auto bg-black rounded-lg overflow-hidden shadow-xl">
      <video
        ref={videoRef}
        controls
        width="100%"
        className="w-full h-auto"
        src={streamUrl}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
