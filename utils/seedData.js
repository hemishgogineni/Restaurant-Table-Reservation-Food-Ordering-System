const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Branch = require('../models/Branch');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Reservation = require('../models/Reservation');
const Order = require('../models/Order');

const seedDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant_reservation_db');
    }

    console.log('Seeding Database...');
    await User.deleteMany({});
    await Branch.deleteMany({});
    await Table.deleteMany({});
    await MenuItem.deleteMany({});
    await Reservation.deleteMany({});
    await Order.deleteMany({});

    const passwordHash = await bcrypt.hash('password123', 10);

    // Create Branch
    const branch = await Branch.create({
      name: 'Christ University Central Branch - Koramangala',
      address: 'Hosur Road, Bengaluru, Karnataka 560029',
      seatingCapacity: 120,
      phone: '+91 80 4012 9100'
    });

    // Create Users
    const customer = await User.create({
      name: 'John Doe',
      email: 'customer@christ.edu',
      passwordHash,
      role: 'customer',
      phone: '9876543210'
    });

    const kitchenStaff = await User.create({
      name: 'Chef Gordon',
      email: 'kitchen@christ.edu',
      passwordHash,
      role: 'kitchen',
      branchId: branch._id
    });

    const manager = await User.create({
      name: 'Admin Manager',
      email: 'admin@christ.edu',
      passwordHash,
      role: 'admin',
      branchId: branch._id
    });

    // Create Tables
    const t1 = await Table.create({ branchId: branch._id, tableNumber: 'T-01', capacity: 2 });
    const t2 = await Table.create({ branchId: branch._id, tableNumber: 'T-02', capacity: 4 });
    const t3 = await Table.create({ branchId: branch._id, tableNumber: 'T-03', capacity: 6 });
    const t4 = await Table.create({ branchId: branch._id, tableNumber: 'T-04', capacity: 8 });

    // Create Menu Items
    const m1 = await MenuItem.create({ branchId: branch._id, name: 'Paneer Butter Masala', category: 'Main Course', price: 280, description: 'Cottage cheese cubes in rich tomato gravy' });
    const m2 = await MenuItem.create({ branchId: branch._id, name: 'Garlic Naan', category: 'Breads', price: 60, description: 'Leavened flatbread topped with minced garlic' });
    const m3 = await MenuItem.create({ branchId: branch._id, name: 'Chicken Biryani', category: 'Main Course', price: 340, description: 'Aromatic basmati rice cooked with succulent chicken' });
    const m4 = await MenuItem.create({ branchId: branch._id, name: 'Virgin Mojito', category: 'Beverages', price: 150, description: 'Refreshing mint and lime mocktail' });
    const m5 = await MenuItem.create({ branchId: branch._id, name: 'Gulab Jamun with Ice Cream', category: 'Dessert', price: 120, description: 'Warm milk solid dumplings served with vanilla ice cream' });

    // Create Reservation
    const resDate = new Date();
    resDate.setHours(resDate.getHours() + 2);
    const reservation = await Reservation.create({
      customerId: customer._id,
      branchId: branch._id,
      tableId: t2._id,
      dateTime: resDate,
      guestsCount: 4,
      status: 'confirmed'
    });

    // Create Sample Orders
    const order1 = await Order.create({
      customerId: customer._id,
      branchId: branch._id,
      tableId: t2._id,
      orderType: 'dine-in',
      items: [
        { menuItemId: m1._id, name: m1.name, price: m1.price, quantity: 2, subtotal: 560 },
        { menuItemId: m2._id, name: m2.name, price: m2.price, quantity: 4, subtotal: 240 },
        { menuItemId: m4._id, name: m4.name, price: m4.price, quantity: 2, subtotal: 300 }
      ],
      status: 'Placed',
      subtotal: 1100,
      taxAmount: 55,
      serviceCharge: 55,
      totalAmount: 1210,
      remarks: 'Less spicy please'
    });

    console.log('Database Seeded Successfully!');
    console.log(`Demo Credentials:
    Customer: customer@christ.edu / password123
    Kitchen Staff: kitchen@christ.edu / password123
    Admin/Manager: admin@christ.edu / password123`);

    return { branch, customer, kitchenStaff, manager, t1, t2, m1, m2, order1, reservation };
  } catch (err) {
    console.error('Seeding Error:', err.message);
  }
};

if (require.main === module) {
  seedDB().then(() => mongoose.connection.close());
}

module.exports = seedDB;
