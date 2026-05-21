import express from 'express';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Register Student
router.post('/register/student', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'student'
    });
    
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register Organization
router.post('/register/organization', async (req, res) => {
  try {
    const { orgName, orgType, email, phone, address, logo, description, adminName, adminEmail, adminPass } = req.body;
    
    const Organization = (await import('../models/Organization.js')).default;
    
    const orgExists = await Organization.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { organizationName: orgName.toLowerCase() }
      ]
    });
    if (orgExists) {
      return res.status(400).json({ message: 'Organization already exists' });
    }
    
    const adminExists = await User.findOne({ email: adminEmail.toLowerCase() });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }
    
    const org = await Organization.create({
      organizationName: orgName,
      organizationType: orgType,
      email: email.toLowerCase(),
      phone,
      address,
      logo: logo || (orgType === 'canteen' ? '🍱' : '✏️'),
      description,
      isApproved: false
    });
    
    const admin = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: adminPass,
      role: 'organization_admin',
      organizationId: org._id
    });
    
    // Initialize canteen or inventory based on type
    if (orgType === 'canteen') {
      const Canteen = (await import('../models/Canteen.js')).default;
      await Canteen.create({
        organizationId: org._id,
        name: 'Canteen 1 (Main Hall)',
        menu: [
          { id: `m-${org._id}-1`, name: 'Deluxe Combo Meal', price: 120, category: 'Combo', isAvailable: true },
          { id: `m-${org._id}-2`, name: 'Hot Tea / Milk Chai', price: 15, category: 'Beverages', isAvailable: true },
          { id: `m-${org._id}-3`, name: 'Samosa (Plate of 2)', price: 30, category: 'Snacks', isAvailable: true }
        ]
      });
    } else {
      const Inventory = (await import('../models/Inventory.js')).default;
      await Inventory.create({
        organizationId: org._id,
        items: [
          { id: `inv-${org._id}-1`, name: 'A4 Printing Paper (Pack of 100)', price: 90, stock: 250, isAvailable: true, category: 'Paper' },
          { id: `inv-${org._id}-2`, name: 'Exam Writing Pad', price: 65, stock: 80, isAvailable: true, category: 'Stationery' },
          { id: `inv-${org._id}-3`, name: 'Ballpoint Pen Black', price: 10, stock: 300, isAvailable: true, category: 'Writing' }
        ]
      });
    }
    
    const token = generateToken(admin);
    
    res.status(201).json({
      success: true,
      organization: org,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        organizationId: admin.organizationId
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Google Login Simulation
router.post('/google', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: Math.random().toString(36).slice(-8),
        role: 'student'
      });
    }
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
