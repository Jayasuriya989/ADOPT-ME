const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['customer', 'ngo'], default: 'customer' },
  phone: { type: String },
  address: { type: String },
  // NGO-specific fields
  ngoDetails: {
    organizationName: { type: String },
    registrationNumber: { type: String },
    licenseDocument: { type: String },
    website: { type: String },
    description: { type: String },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      address: { type: String }
    },
    isVerified: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  },
  // Customer profile
  profilePhoto: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

UserSchema.index({ 'ngoDetails.location': '2dsphere' });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
