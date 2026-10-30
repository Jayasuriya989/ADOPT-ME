const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const authorizeNGO = (req, res, next) => {
  if (req.user.role !== 'ngo') return res.status(403).json({ success: false, message: 'NGO access only' });
  next();
};

const authorizeCustomer = (req, res, next) => {
  if (req.user.role !== 'customer') return res.status(403).json({ success: false, message: 'Customer access only' });
  next();
};

module.exports = { protect, authorizeNGO, authorizeCustomer };
