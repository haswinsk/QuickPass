import express from 'express';
import Order from '../models/Order.js';
import TokenCounter from '../models/TokenCounter.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

const getCanteenPrefix = async (orgId, canteenId) => {
  const Canteen = (await import('../models/Canteen.js')).default;
  const orgCanteens = await Canteen.find({ organizationId: orgId }).sort({ createdAt: 1, _id: 1 });
  const index = orgCanteens.findIndex(c => c._id.toString() === canteenId);
  return `C${index !== -1 ? index + 1 : 1}`;
};

const getNextTokenNumber = async ({ orgId, orderType, canteenId }) => {
  const scopeKey = orderType === 'canteen'
    ? `canteen:${orgId}:${canteenId}`
    : `${orderType}:${orgId}`;

  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const counter = await TokenCounter.findOneAndUpdate(
        { key: scopeKey },
        { $inc: { sequence: 1 }, $setOnInsert: { sequence: 100 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      const prefix = orderType === 'xerox'
        ? 'X'
        : orderType === 'stationery'
          ? 'S'
          : await getCanteenPrefix(orgId, canteenId);

      return `${prefix}-${counter.sequence}`;
    } catch (error) {
      lastError = error;
      if (error?.code !== 11000 || attempt === 1) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Unable to generate token');
};

// Get all orders (for admin)
router.get('/', auth, async (req, res) => {
  try {
    const { role, organizationId } = req.user;
    
    let orders;
    if (role === 'super_admin') {
      orders = await Order.find().sort({ createdAt: -1 });
    } else if (role === 'organization_admin') {
      orders = await Order.find({ organizationId }).sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    }
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Place Xerox Order
router.post('/xerox', auth, async (req, res) => {
  try {
    const { orgId, fileData, copies, printType, paymentType, paymentStatus, paymentId } = req.body;
    
    const Organization = (await import('../models/Organization.js')).default;
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    // Generate token
    const token = await getNextTokenNumber({ orgId, orderType: 'xerox' });
    
    const order = await Order.create({
      organizationId: orgId,
      organizationName: org.organizationName,
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      orderType: 'xerox',
      fileURL: fileData.content,
      fileName: fileData.name,
      fileSize: fileData.size,
      copies,
      printType,
      quantity: copies,
      paymentType,
      paymentStatus,
      orderStatus: 'Preparing',
      tokenNumber: token,
      razorpayPaymentId: paymentId
    });
    
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Place Stationery Order
router.post('/stationery', auth, async (req, res) => {
  try {
    const { orgId, items, paymentType, paymentStatus, paymentId } = req.body;
    
    const Organization = (await import('../models/Organization.js')).default;
    const Inventory = (await import('../models/Inventory.js')).default;
    
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    // Check inventory
    const inventory = await Inventory.findOne({ organizationId: orgId });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    
    for (const item of items) {
      const invItem = inventory.items.find(i => i.id === item.id);
      if (!invItem || invItem.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
      }
    }
    
    // Deduct stock
    for (const item of items) {
      const invItem = inventory.items.find(i => i.id === item.id);
      invItem.stock -= item.quantity;
      if (invItem.stock === 0) {
        invItem.isAvailable = false;
      }
    }
    await inventory.save();
    
    // Generate token
    const token = await getNextTokenNumber({ orgId, orderType: 'stationery' });
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    
    const order = await Order.create({
      organizationId: orgId,
      organizationName: org.organizationName,
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      orderType: 'stationery',
      items: items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
      quantity: totalQty,
      paymentType,
      paymentStatus,
      orderStatus: 'Preparing',
      tokenNumber: token,
      razorpayPaymentId: paymentId
    });
    
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Place Canteen Order
router.post('/canteen', auth, async (req, res) => {
  try {
    const { orgId, canteenId, items, paymentId } = req.body;
    
    const Organization = (await import('../models/Organization.js')).default;
    const Canteen = (await import('../models/Canteen.js')).default;
    
    const org = await Organization.findById(orgId);
    const canteen = await Canteen.findById(canteenId);
    
    if (!org || !canteen || canteen.organizationId.toString() !== orgId) {
      return res.status(404).json({ message: 'Organization or Canteen not found' });
    }
    
    // Check availability
    for (const item of items) {
      const menuItem = canteen.menu.find(m => m.id === item.id);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({ message: `Item ${item.name} is unavailable` });
      }
    }
    
    // Generate token
    const token = await getNextTokenNumber({ orgId, orderType: 'canteen', canteenId });
    
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    
    const order = await Order.create({
      organizationId: orgId,
      organizationName: org.organizationName,
      canteenId,
      canteenName: canteen.name,
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      orderType: 'canteen',
      items: items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
      quantity: totalQty,
      paymentType: 'online',
      paymentStatus: 'Paid',
      orderStatus: 'Preparing',
      tokenNumber: token,
      razorpayPaymentId: paymentId
    });
    
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Order Status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role === 'organization_admin' && order.organizationId.toString() !== req.user.organizationId?.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    if (req.user.role !== 'organization_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Not authorized to update orders' });
    }
    
    order.orderStatus = status;
    if (status === 'Collected') {
      order.paymentStatus = 'Paid';
    }
    
    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
