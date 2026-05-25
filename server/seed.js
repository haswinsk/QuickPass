import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

const adminName = process.env.ADMIN_NAME || 'Campus Chief Administrator';
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@campus.edu').toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || 'password123';

const seedAdmin = async () => {
  try {
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    // Create admin user
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'super_admin'
    });
    
    console.log('Admin user created successfully:');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role: ${admin.role}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
