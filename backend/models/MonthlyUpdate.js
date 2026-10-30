const mongoose = require('mongoose');

const MonthlyUpdateSchema = new mongoose.Schema({
  adoption: { type: mongoose.Schema.Types.ObjectId, ref: 'Adoption', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  month: { type: Number, required: true }, // 1, 2, or 3
  photos: [{ type: String }],
  healthReport: {
    weight: { type: String },
    vetVisited: { type: Boolean, default: false },
    vetNotes: { type: String },
    vaccinesUpToDate: { type: Boolean, default: false },
    overallHealth: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] }
  },
  behaviorReport: {
    isHappy: { type: Boolean, default: true },
    behaviorNotes: { type: String },
    trainingProgress: { type: String }
  },
  additionalNotes: { type: String },
  // NGO Review
  ngoReview: {
    reviewed: { type: Boolean, default: false },
    reviewedAt: { type: Date },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String },
    ngoComment: { type: String }
  },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

MonthlyUpdateSchema.index({ adoption: 1, month: 1 });
MonthlyUpdateSchema.index({ ngo: 1, 'ngoReview.flagged': 1 });

module.exports = mongoose.model('MonthlyUpdate', MonthlyUpdateSchema);
