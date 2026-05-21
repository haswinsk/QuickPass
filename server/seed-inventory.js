import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Organization from './models/Organization.js';
import Inventory from './models/Inventory.js';

dotenv.config();

const seedInventory = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Get all organizations
    const organizations = await Organization.find();
    console.log(`Found ${organizations.length} organizations`);

    for (const org of organizations) {
      // Check if inventory already exists
      const existingInventory = await Inventory.findOne({ organizationId: org._id });
      
      if (existingInventory) {
        console.log(`Inventory already exists for ${org.organizationName}, skipping...`);
        continue;
      }

      // Create sample inventory based on organization type
      let items = [];

      if (org.organizationType === 'xerox_stationery') {
        items = [
          { id: '1', name: 'A4 Size Paper (500 sheets)', price: 250, stock: 50, category: 'Paper', isAvailable: true },
          { id: '2', name: 'Spiral Notebook (200 pages)', price: 80, stock: 100, category: 'Notebooks', isAvailable: true },
          { id: '3', name: 'Pen Pack (10 pcs)', price: 50, stock: 75, category: 'Writing', isAvailable: true },
          { id: '4', name: 'Scale (15cm)', price: 15, stock: 200, category: 'Stationery', isAvailable: true },
          { id: '5', name: 'Eraser (2 pcs)', price: 10, stock: 150, category: 'Stationery', isAvailable: true },
          { id: '6', name: 'Pencil Pack (5 pcs)', price: 30, stock: 120, category: 'Writing', isAvailable: true },
          { id: '7', name: 'Lab Record File', price: 120, stock: 60, category: 'Files', isAvailable: true },
          { id: '8', name: 'Calculator (Basic)', price: 350, stock: 25, category: 'Electronics', isAvailable: true },
        ];
      } else {
        // Canteen inventory (if needed)
        items = [];
      }

      if (items.length > 0) {
        await Inventory.create({
          organizationId: org._id,
          items
        });
        console.log(`Created inventory for ${org.organizationName} with ${items.length} items`);
      }
    }

    console.log('Inventory seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding inventory:', error);
    process.exit(1);
  }
};

seedInventory();
