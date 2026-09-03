const express = require('express');
const router = express.Router();
const Joi = require('joi');
const menuController = require('../controllers/menuController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

const menuItemSchema = Joi.object({
  branchId: Joi.string().required(),
  name: Joi.string().required(),
  category: Joi.string().required(),
  price: Joi.number().min(0).required(),
  description: Joi.string().allow('', null),
  isAvailable: Joi.boolean().default(true)
});

router.get('/', menuController.getMenu);
router.get('/:id', menuController.getMenuItemById);
router.post('/', authenticate, authorize('admin'), validate(menuItemSchema), menuController.createMenuItem);
router.put('/:id', authenticate, authorize('admin'), menuController.updateMenuItem);
router.delete('/:id', authenticate, authorize('admin'), menuController.deleteMenuItem);

module.exports = router;
