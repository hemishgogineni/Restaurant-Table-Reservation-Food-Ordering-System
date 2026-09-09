const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');
const orderController = require('./controllers/orderController');
const reservationController = require('./controllers/reservationController');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const branchRoutes = require('./routes/branchRoutes');
const tableRoutes = require('./routes/tableRoutes');
const menuRoutes = require('./routes/menuRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const orderRoutes = require('./routes/orderRoutes');
const kitchenRoutes = require('./routes/kitchenRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Database Connection
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes Mounting

// HTML Routes - must come before 404 handler
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login-cosmic.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/manager/reports', reportRoutes);

// Additional spec endpoint aliases:
app.get('/api/customers/:id/orders', authenticate, orderController.getCustomerOrderHistory);
app.get('/api/customers/:id/reservations', authenticate, reservationController.getCustomerReservationHistory);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Restaurant System Backend is healthy and running',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler for Unknown API Endpoints
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
    errorCode: 'NOT_FOUND'
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Restaurant System Server Running on Port ${PORT}`);
  console.log(`Live Dashboard: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

module.exports = app;
