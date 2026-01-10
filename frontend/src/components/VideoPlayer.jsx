import React, { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';

const VideoPlayer = ({ videoId, token }) => {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const streamUrl = `${import.meta.env.VITE_API_URL}/videos/stream/${videoId}?token=${token}`;

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden relative aspect-video group">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white z-10">
          <Loader className="animate-spin h-8 w-8" />
        </div>
      )}
      <video
        ref={videoRef}
        controls
        className="w-full h-full object-contain"
        src={streamUrl}
        onLoadedData={() => setLoading(false)}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
