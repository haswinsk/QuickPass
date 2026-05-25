import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  organizationName: {
    type: String,
    required: true
  },
  canteenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
    default: null
  },
  canteenName: {
    type: String,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  orderType: {
    type: String,
    enum: ['xerox', 'stationery', 'canteen'],
    required: true
  },
  // Xerox Fields
  fileURL: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: String,
    default: null
  },
  copies: {
    type: Number,
    default: null
  },
  printType: {
    type: String,
    enum: ['color', 'bw'],
    default: null
  },
  // Stationery / Canteen Fields
  items: [orderItemSchema],
  quantity: {
    type: Number,
    required: true
  },
  paymentType: {
    type: String,
    enum: ['online', 'cod'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pay on Pickup'],
    required: true
  },
  orderStatus: {
    type: String,
    enum: ['Preparing', 'Ready', 'Collected'],
    default: 'Preparing'
  },
  tokenNumber: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

orderSchema.index({ organizationId: 1, tokenNumber: 1 }, { unique: true });

export default mongoose.model('Order', orderSchema);
