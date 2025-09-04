import mongoose from 'mongoose';

const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('College', collegeSchema);
