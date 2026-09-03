const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected (External): ${conn.connection.host}`);
    await autoSeedIfEmpty();
  } catch (error) {
    console.log(`External MongoDB connection failed (${error.message}). Starting In-Memory MongoDB Server...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memUri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`MongoDB Connected (In-Memory Server): ${conn.connection.host}`);
      await autoSeedIfEmpty();
    } catch (memErr) {
      console.error(`Failed to start In-Memory MongoDB: ${memErr.message}`);
    }
  }
};

const autoSeedIfEmpty = async () => {
  try {
    const Branch = require('../models/Branch');
    const count = await Branch.countDocuments();
    if (count === 0) {
      console.log('Database empty. Auto-seeding initial CIA-3 demo dataset...');
      const seedDB = require('../utils/seedData');
      await seedDB();
    }
  } catch (err) {
    console.error('Auto seed check error:', err.message);
  }
};

module.exports = connectDB;
