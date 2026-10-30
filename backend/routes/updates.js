const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MonthlyUpdate = require('../models/MonthlyUpdate');
const Adoption = require('../models/Adoption');
const { protect, authorizeNGO, authorizeCustomer } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/updates';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `update-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// @route POST /api/updates - Submit monthly update (customer)
router.post('/', protect, authorizeCustomer, upload.array('photos', 5), async (req, res) => {
  try {
    const { adoptionId, month, healthReport, behaviorReport, additionalNotes } = req.body;
    const adoption = await Adoption.findById(adoptionId);
    if (!adoption) return res.status(404).json({ success: false, message: 'Adoption not found' });
    if (adoption.customer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your adoption' });
    if (adoption.status !== 'permanently-adopted')
      return res.status(400).json({ success: false, message: 'Pet must be permanently adopted first' });

    const monthNum = parseInt(month);
    if (monthNum < 1 || monthNum > 3) return res.status(400).json({ success: false, message: 'Month must be 1, 2, or 3' });

    const exists = await MonthlyUpdate.findOne({ adoption: adoptionId, month: monthNum });
    if (exists) return res.status(400).json({ success: false, message: `Month ${monthNum} update already submitted` });

    const photos = req.files ? req.files.map(f => `/uploads/updates/${f.filename}`) : [];
    const update = await MonthlyUpdate.create({
      adoption: adoptionId,
      customer: req.user._id,
      ngo: adoption.ngo,
      pet: adoption.pet,
      month: monthNum,
      photos,
      healthReport: healthReport ? JSON.parse(healthReport) : {},
      behaviorReport: behaviorReport ? JSON.parse(behaviorReport) : {},
      additionalNotes
    });

    res.status(201).json({ success: true, update });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/updates/adoption/:adoptionId - Get all updates for an adoption
router.get('/adoption/:adoptionId', protect, async (req, res) => {
  try {
    const updates = await MonthlyUpdate.find({ adoption: req.params.adoptionId }).sort({ month: 1 });
    res.json({ success: true, updates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/updates/ngo - NGO sees all updates for their adoptions
router.get('/ngo', protect, authorizeNGO, async (req, res) => {
  try {
    const { flagged } = req.query;
    const query = { ngo: req.user._id };
    if (flagged === 'true') query['ngoReview.flagged'] = true;
    const updates = await MonthlyUpdate.find(query)
      .populate('customer', 'name email phone')
      .populate('pet', 'name species images')
      .populate('adoption', 'status')
      .sort({ createdAt: -1 });
    res.json({ success: true, updates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route PUT /api/updates/:id/review - NGO reviews an update
router.put('/:id/review', protect, authorizeNGO, async (req, res) => {
  try {
    const { flagged, flagReason, ngoComment } = req.body;
    const update = await MonthlyUpdate.findByIdAndUpdate(req.params.id, {
      'ngoReview.reviewed': true,
      'ngoReview.reviewedAt': new Date(),
      'ngoReview.flagged': flagged,
      'ngoReview.flagReason': flagReason,
      'ngoReview.ngoComment': ngoComment
    }, { new: true });
    res.json({ success: true, update });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/updates/my - Customer's own updates
router.get('/my', protect, authorizeCustomer, async (req, res) => {
  try {
    const updates = await MonthlyUpdate.find({ customer: req.user._id })
      .populate('pet', 'name species images')
      .sort({ createdAt: -1 });
    res.json({ success: true, updates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
