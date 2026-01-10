import React, { useEffect, useState, useContext, useRef } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import VideoPlayer from '../components/VideoPlayer';
import { Play, Upload, AlertTriangle, CheckCircle, Clock, X, Film, FileVideo, Calendar, HardDrive } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      const { data } = await api.get('/videos');
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', file.name);

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

  const getStatusInfo = (status) => {
    switch (status) {
      case 'safe': return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' };
      case 'flagged': return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
      default: return { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', animate: true };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and view your video content</p>
        </div>
        
        {(user.role === 'editor' || user.role === 'admin') && (
          <div className="flex items-center">
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
              className={`flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${uploading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Upload New Video
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Video Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden h-72 animate-pulse">
              <div className="h-40 bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            const statusInfo = getStatusInfo(video.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div key={video._id} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
                {/* Thumbnail Area */}
                <div className="h-48 bg-gray-900 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileVideo className="h-16 w-16 text-gray-700 opacity-50" />
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    {video.status === 'safe' ? (
                      <button
                        onClick={() => setSelectedVideo(video)}
                        className="transform scale-90 group-hover:scale-100 transition-transform duration-300 bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-full hover:bg-opacity-30"
                      >
                        <Play className="h-8 w-8 text-white fill-current" />
                      </button>
                    ) : (
                      <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
                        <StatusIcon className={`h-5 w-5 ${statusInfo.color} ${statusInfo.animate ? 'animate-spin' : ''}`} />
                        <span className="font-medium text-gray-900 capitalize">{video.status}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Duration/Status Badge */}
                  <div className="absolute bottom-2 right-2">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color} border ${statusInfo.border}`}>
                      {video.status === 'processing' && <StatusIcon className="mr-1 h-3 w-3 animate-spin" />}
                      {video.status}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 flex-1 pr-2" title={video.title}>
                      {video.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 space-x-4 mt-4">
                    <div className="flex items-center">
                      <HardDrive className="h-4 w-4 mr-1.5" />
                      {(video.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1.5" />
                      {new Date(video.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {videos.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Film className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No videos yet</h3>
              <p className="mt-1 text-sm text-gray-500 text-center max-w-sm">
                Upload your first video to get started. It will be processed and available for streaming shortly.
              </p>
              {(user.role === 'editor' || user.role === 'admin') && (
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="mt-6 btn-primary"
                >
                  Upload Video
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setSelectedVideo(null)}
            ></div>

            {/* Modal panel */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-black rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
                <button
                  type="button"
                  className="bg-black bg-opacity-50 rounded-full p-2 text-gray-400 hover:text-white focus:outline-none"
                  onClick={() => setSelectedVideo(null)}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="bg-black">
                <div className="aspect-w-16 aspect-h-9">
                  <VideoPlayer videoId={selectedVideo._id} token={user.token} />
                </div>
              </div>
              
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {selectedVideo.title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Uploaded on {new Date(selectedVideo.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
