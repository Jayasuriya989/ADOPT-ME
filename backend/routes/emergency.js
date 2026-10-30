const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const EmergencyReport = require('../models/EmergencyReport');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/emergency';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `emergency-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Helper: Find nearest NGO using coordinates
const findNearestNGO = async (lat, lng) => {
  try {
    const ngos = await User.find({
      role: 'ngo',
      'ngoDetails.location.coordinates': { $exists: true, $ne: [0, 0] }
    }).select('name email phone ngoDetails');

    if (!ngos.length) return null;

    let nearest = null;
    let minDist = Infinity;
    ngos.forEach(ngo => {
      const [ngoLng, ngoLat] = ngo.ngoDetails.location.coordinates;
      const dist = Math.sqrt(Math.pow(lat - ngoLat, 2) + Math.pow(lng - ngoLng, 2));
      if (dist < minDist) { minDist = dist; nearest = ngo; }
    });
    return nearest;
  } catch (e) { return null; }
};

// @route POST /api/emergency - Submit emergency report (PUBLIC)
router.post('/', upload.array('photos', 3), async (req, res) => {
  try {
    const { reporterName, reporterPhone, reporterEmail, animalType, description, urgencyLevel, lat, lng, address, landmark } = req.body;
    const photos = req.files ? req.files.map(f => `/uploads/emergency/${f.filename}`) : [];

    let location = { address, landmark };
    if (lat && lng) {
      location.coordinates = [parseFloat(lng), parseFloat(lat)];
    }

    // Find nearest NGO
    let assignedNGO = null;
    if (lat && lng) {
      assignedNGO = await findNearestNGO(parseFloat(lat), parseFloat(lng));
    }
    if (!assignedNGO) {
      assignedNGO = await User.findOne({ role: 'ngo' }).select('_id name email phone');
    }

    const report = await EmergencyReport.create({
      reporterName, reporterPhone, reporterEmail,
      animalType, description, urgencyLevel, photos, location,
      status: assignedNGO ? 'assigned' : 'pending',
      assignedNGO: assignedNGO ? assignedNGO._id : null,
      assignedAt: assignedNGO ? new Date() : null
    });

    const populated = await EmergencyReport.findById(report._id).populate('assignedNGO', 'name email phone ngoDetails.organizationName');

    // Emit real-time alert via socket.io (handled in server.js)
    if (req.app.get('io') && assignedNGO) {
      req.app.get('io').to(`ngo-${assignedNGO._id}`).emit('emergency-alert', {
        report: populated,
        message: `🚨 New Emergency Report: ${animalType} in distress at ${address || 'location detected'}`
      });
    }

    res.status(201).json({ success: true, report: populated, assignedNGO });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/emergency - Get all reports (NGO - their assigned ones)
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (req.user.role === 'ngo') query.assignedNGO = req.user._id;
    if (status) query.status = status;
    const reports = await EmergencyReport.find(query)
      .populate('assignedNGO', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/emergency/all - All reports (for admin/overview)
router.get('/all', async (req, res) => {
  try {
    const reports = await EmergencyReport.find()
      .populate('assignedNGO', 'name email ngoDetails.organizationName')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route PUT /api/emergency/:id/status - Update report status (NGO)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, ngoResponse, resolutionNotes } = req.body;
    const updateData = { status, ngoResponse };
    if (status === 'resolved') { updateData.resolvedAt = new Date(); updateData.resolutionNotes = resolutionNotes; }
    const report = await EmergencyReport.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('assignedNGO', 'name email');
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/emergency/:id - Single report
router.get('/:id', async (req, res) => {
  try {
    const report = await EmergencyReport.findById(req.params.id)
      .populate('assignedNGO', 'name email phone ngoDetails.organizationName');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
