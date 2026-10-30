const mongoose = require('mongoose');

const PetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  species: { type: String, enum: ['dog', 'cat', 'bird', 'rabbit', 'other'], required: true },
  breed: { type: String },
  age: { type: String },
  gender: { type: String, enum: ['male', 'female', 'unknown'] },
  size: { type: String, enum: ['small', 'medium', 'large'] },
  color: { type: String },
  description: { type: String, required: true },
  healthStatus: {
    vaccinated: { type: Boolean, default: false },
    neutered: { type: Boolean, default: false },
    microchipped: { type: Boolean, default: false },
    healthNotes: { type: String }
  },
  images: [{ type: String }],
  location: { type: String },
  status: {
    type: String,
    enum: ['available', 'in-trial', 'adopted', 'returned'],
    default: 'available'
  },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true },
  viewCount: { type: Number, default: 0 }
}, { timestamps: true });

PetSchema.index({ species: 1, status: 1 });
PetSchema.index({ ngo: 1 });

module.exports = mongoose.model('Pet', PetSchema);
