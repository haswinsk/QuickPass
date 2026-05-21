import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: true
  },
  organizationType: {
    type: String,
    enum: ['xerox_stationery', 'canteen'],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  logo: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Organization', organizationSchema);
