const express = require('express');
const router = express.Router();
const kitchenController = require('../controllers/kitchenController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/queue', authenticate, authorize('kitchen', 'admin'), kitchenController.getKitchenQueue);

module.exports = router;
