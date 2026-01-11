const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  filename: { type: String, required: true },
  path: { type: String, required: true }, // Local path or Cloudinary URL
  cloudinaryUrl: { type: String }, // Cloudinary secure URL
  cloudinaryPublicId: { type: String }, // Cloudinary public ID for management
  size: { type: Number }, // Size in bytes
  mimetype: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['processing', 'safe', 'flagged'], default: 'processing' },
  views: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
