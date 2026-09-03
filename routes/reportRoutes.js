const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/analytics', authenticate, authorize('admin'), reportController.getManagerAnalytics);

module.exports = router;
