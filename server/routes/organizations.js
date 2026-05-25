import express from 'express';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Canteen from '../models/Canteen.js';
import Inventory from '../models/Inventory.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

const canAccessOrganization = (req, organizationId) => {
  if (req.user.role === 'super_admin') return true;
  if (req.user.role === 'organization_admin') {
    return req.user.organizationId?.toString() === organizationId.toString();
  }
  return true;
};

// Get approved organizations (public - for students)
router.get('/approved', async (req, res) => {
  try {
    const organizations = await Organization.find({ isApproved: true }).sort({ createdAt: -1 });
    res.json(organizations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all organizations (for super admin)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const organizations = await Organization.find().sort({ createdAt: -1 });
    res.json(organizations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get organization by ID
router.get('/:id', auth, async (req, res) => {
  try {
    if (!canAccessOrganization(req, req.params.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.json(organization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve organization
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    organization.isApproved = true;
    await organization.save();
    
    res.json({ success: true, organization });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete organization
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await Organization.findByIdAndDelete(req.params.id);
    await User.deleteMany({ organizationId: req.params.id });
    await Canteen.deleteMany({ organizationId: req.params.id });
    await Inventory.deleteMany({ organizationId: req.params.id });
    
    res.json({ success: true, message: 'Organization deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get canteens for organization
router.get('/:id/canteens', auth, async (req, res) => {
  try {
    if (!canAccessOrganization(req, req.params.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const canteens = await Canteen.find({ organizationId: req.params.id });
    res.json(canteens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add canteen
router.post('/:id/canteens', auth, async (req, res) => {
  try {
    if (!canAccessOrganization(req, req.params.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name } = req.body;
    const canteen = await Canteen.create({
      organizationId: req.params.id,
      name,
      menu: []
    });
    res.status(201).json({ success: true, canteen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete canteen
router.delete('/:id/canteens/:canteenId', auth, async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    if (!canAccessOrganization(req, req.params.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const canteen = await Canteen.findById(req.params.canteenId);
    if (!canteen) {
      return res.status(404).json({ message: 'Canteen not found' });
    }

    if (canteen.organizationId.toString() !== req.params.id) {
      return res.status(400).json({ message: 'Canteen does not belong to this organization' });
    }

    await Canteen.findByIdAndDelete(req.params.canteenId);
    res.json({ success: true, message: 'Canteen deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update canteen menu
router.patch('/canteens/:canteenId/menu', auth, async (req, res) => {
  try {
    const { menu } = req.body;
    const canteen = await Canteen.findById(req.params.canteenId);
    if (!canteen) {
      return res.status(404).json({ message: 'Canteen not found' });
    }

    if (!canAccessOrganization(req, canteen.organizationId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    canteen.menu = menu;
    await canteen.save();
    res.json({ success: true, canteen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get inventory for organization (public - students need to see items)
router.get('/:id/inventory', async (req, res) => {
  try {
    const inventory = await Inventory.findOne({ organizationId: req.params.id });
    res.json(inventory || { items: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update inventory
router.patch('/:id/inventory', auth, async (req, res) => {
  try {
    const { items } = req.body;

    if (!canAccessOrganization(req, req.params.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let inventory = await Inventory.findOne({ organizationId: req.params.id });
    
    if (!inventory) {
      inventory = await Inventory.create({
        organizationId: req.params.id,
        items
      });
    } else {
      inventory.items = items;
      await inventory.save();
    }
    
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
