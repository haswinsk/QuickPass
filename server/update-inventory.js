import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Organization from './models/Organization.js';
import Inventory from './models/Inventory.js';

dotenv.config();

const updateInventory = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Get all organizations
    const organizations = await Organization.find();
    console.log(`Found ${organizations.length} organizations`);

    for (const org of organizations) {
      // Get or create inventory
      let inventory = await Inventory.findOne({ organizationId: org._id });
      
      if (!inventory) {
        inventory = await Inventory.create({
          organizationId: org._id,
          items: []
        });
        console.log(`Created new inventory for ${org.organizationName}`);
      }

      // Add sample items if inventory is empty
      if (inventory.items.length === 0 && org.organizationType === 'xerox_stationery') {
        const sampleItems = [
          { id: '1', name: 'A4 Size Paper (500 sheets)', price: 250, stock: 50, category: 'Paper', isAvailable: true },
          { id: '2', name: 'Spiral Notebook (200 pages)', price: 80, stock: 100, category: 'Notebooks', isAvailable: true },
          { id: '3', name: 'Pen Pack (10 pcs)', price: 50, stock: 75, category: 'Writing', isAvailable: true },
          { id: '4', name: 'Scale (15cm)', price: 15, stock: 200, category: 'Stationery', isAvailable: true },
          { id: '5', name: 'Eraser (2 pcs)', price: 10, stock: 150, category: 'Stationery', isAvailable: true },
          { id: '6', name: 'Pencil Pack (5 pcs)', price: 30, stock: 120, category: 'Writing', isAvailable: true },
          { id: '7', name: 'Lab Record File', price: 120, stock: 60, category: 'Files', isAvailable: true },
          { id: '8', name: 'Calculator (Basic)', price: 350, stock: 25, category: 'Electronics', isAvailable: true },
        ];

        inventory.items = sampleItems;
        await inventory.save();
        console.log(`Updated inventory for ${org.organizationName} with ${sampleItems.length} items`);
      } else if (inventory.items.length > 0) {
        console.log(`Inventory for ${org.organizationName} already has ${inventory.items.length} items`);
      } else {
        console.log(`Skipped ${org.organizationName} (not xerox_stationery type)`);
      }
    }

    console.log('Inventory update completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating inventory:', error);
    process.exit(1);
  }
};

updateInventory();
