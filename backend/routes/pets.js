const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Pet = require('../models/Pet');
const { protect, authorizeNGO } = require('../middleware/auth');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/pets';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `pet-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Images only!'));
  }
});

// @route GET /api/pets - Discovery feed (public)
router.get('/', async (req, res) => {
  try {
    const { species, status = 'available', search, page = 1, limit = 12, location } = req.query;
    const query = { isActive: true };
    if (species) query.species = species;
    if (status) query.status = status;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await Pet.countDocuments(query);
    const pets = await Pet.find(query)
      .populate('ngo', 'name email ngoDetails.organizationName ngoDetails.location')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), pets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/pets/:id - Single pet
router.get('/:id', async (req, res) => {
  try {
    const pet = await Pet.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }, { new: true })
      .populate('ngo', 'name email phone ngoDetails');
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });
    res.json({ success: true, pet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/pets/ngo/my-pets - NGO's own pets
router.get('/ngo/my-pets', protect, authorizeNGO, async (req, res) => {
  try {
    const pets = await Pet.find({ ngo: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, pets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route POST /api/pets - Create pet listing (NGO only)
router.post('/', protect, authorizeNGO, upload.array('images', 5), async (req, res) => {
  try {
    const { name, species, breed, age, gender, size, color, description, location, tags, healthStatus } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/pets/${f.filename}`) : [];
    const pet = await Pet.create({
      name, species, breed, age, gender, size, color, description, location, tags: tags ? tags.split(',') : [],
      healthStatus: healthStatus ? JSON.parse(healthStatus) : {},
      images,
      ngo: req.user._id
    });
    res.status(201).json({ success: true, pet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route PUT /api/pets/:id - Update pet (NGO only)
router.put('/:id', protect, authorizeNGO, upload.array('images', 5), async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });
    if (pet.ngo.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your listing' });

    const updates = req.body;
    if (updates.healthStatus) updates.healthStatus = JSON.parse(updates.healthStatus);
    if (updates.tags) updates.tags = updates.tags.split(',');
    if (req.files && req.files.length > 0) {
      updates.images = [...(pet.images || []), ...req.files.map(f => `/uploads/pets/${f.filename}`)];
    }
    const updated = await Pet.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, pet: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route DELETE /api/pets/:id - Delete pet (NGO only)
router.delete('/:id', protect, authorizeNGO, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });
    if (pet.ngo.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your listing' });
    await Pet.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Pet listing removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
