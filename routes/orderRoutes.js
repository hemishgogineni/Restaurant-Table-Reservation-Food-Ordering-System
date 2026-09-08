const express = require('express');
const router = express.Router();
const Joi = require('joi');
const orderController = require('../controllers/orderController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

const orderItemSchema = Joi.object({
  menuItemId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required()
});

const placeOrderSchema = Joi.object({
  branchId: Joi.string().required(),
  tableId: Joi.string().allow('', null),
  orderType: Joi.string().valid('dine-in', 'takeaway').default('dine-in'),
  items: Joi.array().items(orderItemSchema).min(1).required(),
  remarks: Joi.string().allow('', null)
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('Placed', 'Preparing', 'Ready', 'Served', 'Delivered', 'Cancelled').required(),
  remarks: Joi.string().allow('', null)
});

router.post('/', authenticate, authorize('customer'), validate(placeOrderSchema), orderController.placeOrder);
router.put('/:id/status', authenticate, authorize('kitchen', 'admin'), validate(updateStatusSchema), orderController.updateOrderStatus);
router.get('/my-history', authenticate, orderController.getCustomerOrderHistory);
router.get('/:id/bill', authenticate, orderController.getOrderBill);
router.get('/:id', authenticate, orderController.getOrderById);

module.exports = router;
