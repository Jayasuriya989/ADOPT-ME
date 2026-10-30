const mongoose = require('mongoose');

const EmergencyReportSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional (public)
  reporterName: { type: String, required: true },
  reporterPhone: { type: String, required: true },
  reporterEmail: { type: String },
  animalType: { type: String, enum: ['dog', 'cat', 'bird', 'other'], required: true },
  description: { type: String, required: true },
  urgencyLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  photos: [{ type: String }],
  location: {
    coordinates: { type: [Number], index: '2dsphere' }, // [lng, lat]
    address: { type: String },
    landmark: { type: String }
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  assignedNGO: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date },
  resolvedAt: { type: Date },
  resolutionNotes: { type: String },
  ngoResponse: { type: String }
}, { timestamps: true });

EmergencyReportSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('EmergencyReport', EmergencyReportSchema);
