import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let connected = false;

const connectWithRetry = async (retries = 3, delayMs = 3000) => {
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI is not configured; starting without a database connection');
    return null;
  }

  // Avoid buffering commands while not connected so requests fail fast
  mongoose.set('bufferCommands', false);

  const opts = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, opts);
      connected = true;
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  console.error('MongoDB connection failed after retries');
  connected = false;
  return null;
};

const isDBConnected = () => connected || mongoose.connection.readyState === 1;

export { connectWithRetry as default, isDBConnected };
