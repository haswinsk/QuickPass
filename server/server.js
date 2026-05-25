import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB, { isDBConnected } from './config/db.js';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import organizationRoutes from './routes/organizations.js';
import uploadRoutes from './routes/upload.js';
import paymentRoutes from './routes/payments.js';

dotenv.config();

const app = express();

// Connect to MongoDB (start attempts asynchronously)
connectDB();

app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Service temporarily unavailable: database not connected' });
  }
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
// Middleware
app.use(cors());
// Connect to MongoDB (start attempts asynchronously)
connectDB();

// If DB isn't connected yet, reject API requests (except health) with 503
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (!isDBConnected()) {
    return res.status(503).json({ message: 'Service temporarily unavailable: database not connected' });
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', db: isDBConnected() ? 'connected' : 'disconnected' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
