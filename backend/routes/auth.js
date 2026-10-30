const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// @route POST /api/auth/register
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('role').isIn(['customer', 'ngo']).withMessage('Role must be customer or ngo')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { name, email, password, role, phone, address, ngoDetails } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const userData = { name, email, password, role, phone, address };
    if (role === 'ngo' && ngoDetails) {
      userData.ngoDetails = {
        ...ngoDetails,
        verificationStatus: 'pending',
        isVerified: false
      };
    }
    const user = await User.create(userData);
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id, name: user.name, email: user.email,
        role: user.role, ngoDetails: user.ngoDetails
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route POST /api/auth/login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        _id: user._id, name: user.name, email: user.email,
        role: user.role, phone: user.phone, address: user.address,
        profilePhoto: user.profilePhoto, ngoDetails: user.ngoDetails
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/auth/ngos - list all verified NGOs
router.get('/ngos', async (req, res) => {
  try {
    const ngos = await User.find({ role: 'ngo', 'ngoDetails.isVerified': true })
      .select('name email phone ngoDetails');
    res.json({ success: true, ngos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/auth/ngos/all - all NGOs (for emergency routing including unverified)
router.get('/ngos/all', async (req, res) => {
  try {
    const ngos = await User.find({ role: 'ngo' }).select('name email phone ngoDetails');
    res.json({ success: true, ngos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route PUT /api/auth/ngo/verify/:id (admin action placeholder)
router.put('/ngo/verify/:id', protect, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const user = await User.findByIdAndUpdate(req.params.id, {
      'ngoDetails.verificationStatus': status,
      'ngoDetails.isVerified': status === 'approved'
    }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
