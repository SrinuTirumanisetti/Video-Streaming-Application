const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// DEBUG: Log environment variables to ensure they are loaded
console.log('--- Cloudinary Config ---');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Loaded' : 'MISSING');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Loaded' : 'MISSING');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Loaded' : 'MISSING');
console.log('-------------------------');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pulse-videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'],
    // Generate unique public_id
    public_id: (req, file) => {
      return `video-${Date.now()}-${file.originalname.split('.')[0]}`;
    }
  }
});

module.exports = { cloudinary, storage };