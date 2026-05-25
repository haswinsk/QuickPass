import mongoose from 'mongoose';

const tokenCounterSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  sequence: {
    type: Number,
    default: 100
  }
}, {
  timestamps: true
});

export default mongoose.models.TokenCounter || mongoose.model('TokenCounter', tokenCounterSchema);