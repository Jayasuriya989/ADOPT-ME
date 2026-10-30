const express = require('express');
const router = express.Router();
const Adoption = require('../models/Adoption');
const Pet = require('../models/Pet');
const { protect, authorizeNGO, authorizeCustomer } = require('../middleware/auth');

// @route POST /api/adoptions/apply - Customer applies for adoption
router.post('/apply', protect, authorizeCustomer, async (req, res) => {
  try {
    const { petId, applicationNotes } = req.body;
    const pet = await Pet.findById(petId);
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });
    if (pet.status !== 'available') return res.status(400).json({ success: false, message: 'Pet is not available' });

    const existing = await Adoption.findOne({ pet: petId, customer: req.user._id, status: { $ne: 'rejected' } });
    if (existing) return res.status(400).json({ success: false, message: 'You already applied for this pet' });

    const adoption = await Adoption.create({
      pet: petId,
      customer: req.user._id,
      ngo: pet.ngo,
      applicationNotes,
      status: 'application'
    });

    res.status(201).json({ success: true, adoption });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route POST /api/adoptions/:id/sign-declaration - Customer signs digital declaration
router.post('/:id/sign-declaration', protect, authorizeCustomer, async (req, res) => {
  try {
    const { signatureData, customerName, customerAddress, customerPhone } = req.body;
    const adoption = await Adoption.findById(req.params.id);
    if (!adoption) return res.status(404).json({ success: false, message: 'Adoption not found' });
    if (adoption.customer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your adoption' });

    const agreementText = `I, ${customerName}, residing at ${customerAddress}, hereby agree to:
1. Provide proper care, shelter, food, and medical attention to the adopted pet.
2. Compensate the NGO for any damages or mistreatment caused to the pet.
3. Participate in the one-week trial period and comply with all monitoring requirements.
4. Submit monthly health reports for three months post-adoption.
5. Return the pet if unable to provide adequate care.
Signed on: ${new Date().toLocaleDateString()}`;

    adoption.declaration = {
      signed: true,
      signedAt: new Date(),
      signatureData,
      agreementText,
      customerName,
      customerAddress,
      customerPhone
    };
    adoption.status = 'trial';

    // Start 7-day trial
    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    adoption.trial = { startDate: trialStart, endDate: trialEnd, status: 'active' };

    await adoption.save();

    // Update pet status to in-trial
    await Pet.findByIdAndUpdate(adoption.pet, { status: 'in-trial' });

    res.json({ success: true, adoption });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route PUT /api/adoptions/:id/approve - NGO approves application
router.put('/:id/approve', protect, authorizeNGO, async (req, res) => {
  try {
    const { ngoNotes } = req.body;
    const adoption = await Adoption.findById(req.params.id);
    if (!adoption) return res.status(404).json({ success: false, message: 'Not found' });
    if (adoption.ngo.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your adoption' });

    adoption.status = 'declaration-pending';
    adoption.ngoNotes = ngoNotes;
    adoption.approvedAt = new Date();
    await adoption.save();

    res.json({ success: true, adoption });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route PUT /api/adoptions/:id/reject - NGO rejects application
router.put('/:id/reject', protect, authorizeNGO, async (req, res) => {
  try {
    const { ngoNotes } = req.body;
    const adoption = await Adoption.findByIdAndUpdate(req.params.id, {
      status: 'rejected', ngoNotes
    }, { new: true });
    res.json({ success: true, adoption });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route PUT /api/adoptions/:id/complete-trial - Mark trial as completed (permanently adopted)
router.put('/:id/complete-trial', protect, async (req, res) => {
  try {
    const adoption = await Adoption.findById(req.params.id);
    if (!adoption) return res.status(404).json({ success: false, message: 'Not found' });

    adoption.status = 'permanently-adopted';
    adoption.trial.status = 'completed';
    adoption.permanentlyAdoptedAt = new Date();
    await adoption.save();
    await Pet.findByIdAndUpdate(adoption.pet, { status: 'adopted' });

    res.json({ success: true, adoption });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route PUT /api/adoptions/:id/return - Return pet
router.put('/:id/return', protect, async (req, res) => {
  try {
    const { returnReason } = req.body;
    const adoption = await Adoption.findById(req.params.id);
    if (!adoption) return res.status(404).json({ success: false, message: 'Not found' });

    adoption.status = 'returned';
    adoption.trial.status = 'returned';
    adoption.trial.returnReason = returnReason;
    await adoption.save();
    await Pet.findByIdAndUpdate(adoption.pet, { status: 'returned' });

    res.json({ success: true, adoption });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/adoptions/my - Customer's adoptions
router.get('/my', protect, authorizeCustomer, async (req, res) => {
  try {
    const adoptions = await Adoption.find({ customer: req.user._id })
      .populate('pet', 'name species images status')
      .populate('ngo', 'name ngoDetails.organizationName')
      .sort({ createdAt: -1 });
    res.json({ success: true, adoptions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/adoptions/ngo - NGO's adoption requests
router.get('/ngo', protect, authorizeNGO, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { ngo: req.user._id };
    if (status) query.status = status;
    const adoptions = await Adoption.find(query)
      .populate('pet', 'name species images')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, adoptions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/adoptions/:id - Single adoption detail
router.get('/:id', protect, async (req, res) => {
  try {
    const adoption = await Adoption.findById(req.params.id)
      .populate('pet')
      .populate('customer', 'name email phone address')
      .populate('ngo', 'name email phone ngoDetails');
    if (!adoption) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, adoption });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
