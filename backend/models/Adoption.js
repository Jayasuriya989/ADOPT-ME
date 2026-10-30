const mongoose = require('mongoose');

const AdoptionSchema = new mongoose.Schema({
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Digital Declaration
  declaration: {
    signed: { type: Boolean, default: false },
    signedAt: { type: Date },
    signatureData: { type: String }, // base64 signature or name
    agreementText: { type: String },
    customerName: { type: String },
    customerAddress: { type: String },
    customerPhone: { type: String }
  },
  // Trial Period
  trial: {
    startDate: { type: Date },
    endDate: { type: Date }, // startDate + 7 days
    status: { type: String, enum: ['pending', 'active', 'completed', 'returned'], default: 'pending' },
    returnReason: { type: String }
  },
  // Adoption Status
  status: {
    type: String,
    enum: ['application', 'declaration-pending', 'trial', 'permanently-adopted', 'returned', 'rejected'],
    default: 'application'
  },
  applicationNotes: { type: String },
  ngoNotes: { type: String },
  approvedAt: { type: Date },
  permanentlyAdoptedAt: { type: Date }
}, { timestamps: true });

AdoptionSchema.index({ customer: 1, status: 1 });
AdoptionSchema.index({ ngo: 1, status: 1 });
AdoptionSchema.index({ pet: 1 });

module.exports = mongoose.model('Adoption', AdoptionSchema);
