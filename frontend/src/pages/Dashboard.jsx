import React, { useEffect, useState, useContext, useRef } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import VideoPlayer from '../components/VideoPlayer';
import { Play, Upload, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchVideos();

    // Connect to Socket.io
    const socketUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    socketRef.current = io(socketUrl);

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
    });

    socketRef.current.on('videoStatusUpdate', (data) => {
      console.log('Status update:', data);
      setVideos((prevVideos) =>
        prevVideos.map((video) =>
          video._id === data.videoId ? { ...video, status: data.status } : video
        )
      );
      toast.info(`Video status updated: ${data.status}`);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchVideos = async () => {
    try {
      const { data } = await api.get('/videos');
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', file.name); // Simple title for now

    setUploading(true);
    try {
      const { data } = await api.post('/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setVideos([data, ...videos]);
      toast.success('Video uploaded successfully! Processing started.');
      fileInputRef.current.value = '';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'safe': return <CheckCircle className="text-green-500" size={20} />;
      case 'flagged': return <AlertTriangle className="text-red-500" size={20} />;
      default: return <Clock className="text-yellow-500 animate-spin" size={20} />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Video Dashboard</h2>
        {(user.role === 'editor' || user.role === 'admin') && (
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
            >
              <Upload className="mr-2" size={20} />
              {uploading ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>
        )}
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 rounded-lg w-full max-w-4xl relative">
            <button 
              onClick={() => setSelectedVideo(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl font-bold"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-4">{selectedVideo.title}</h3>
            <VideoPlayer videoId={selectedVideo._id} token={user.token} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gray-200 flex items-center justify-center relative group">
              {video.status === 'safe' ? (
                <button
                  onClick={() => setSelectedVideo(video)}
                  className="p-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="text-blue-600 ml-1" />
                </button>
              ) : (
                <div className="text-gray-500 font-medium capitalize flex items-center">
                  {getStatusIcon(video.status)}
                  <span className="ml-2">{video.status}</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg truncate pr-2">{video.title}</h3>
                <span title={`Status: ${video.status}`}>
                  {getStatusIcon(video.status)}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                {(video.size / (1024 * 1024)).toFixed(2)} MB • {new Date(video.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
        {videos.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No videos found. Upload one to get started!
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
