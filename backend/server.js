require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const connectDB = require('./config/db');
const Adoption = require('./models/Adoption');
const Pet = require('./models/Pet');

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/adoptions', require('./routes/adoptions'));
app.use('/api/updates', require('./routes/updates'));
app.use('/api/emergency', require('./routes/emergency'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// Socket.io - Real-time alerts
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('join-ngo-room', (ngoId) => {
    socket.join(`ngo-${ngoId}`);
    console.log(`NGO ${ngoId} joined their room`);
  });

  socket.on('join-customer-room', (customerId) => {
    socket.join(`customer-${customerId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// CRON JOB: Every hour - check trials that ended and mark permanently adopted
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const expiredTrials = await Adoption.find({
      status: 'trial',
      'trial.endDate': { $lte: now },
      'trial.status': 'active'
    });

    for (const adoption of expiredTrials) {
      adoption.status = 'permanently-adopted';
      adoption.trial.status = 'completed';
      adoption.permanentlyAdoptedAt = now;
      await adoption.save();
      await Pet.findByIdAndUpdate(adoption.pet, { status: 'adopted' });
      console.log(`✅ Auto-completed trial for adoption ${adoption._id}`);

      // Notify customer
      io.to(`customer-${adoption.customer}`).emit('trial-completed', {
        adoptionId: adoption._id,
        message: '🎉 Congratulations! Your trial period is complete. The pet is now permanently yours!'
      });
    }
  } catch (err) {
    console.error('Cron error:', err.message);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready`);
});
