import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    required: true
  }
});

const inventorySchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    unique: true
  },
  items: [inventoryItemSchema]
}, {
  timestamps: true
});

export default mongoose.model('Inventory', inventorySchema);
