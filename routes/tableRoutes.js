const express = require('express');
const router = express.Router();
const Joi = require('joi');
const tableController = require('../controllers/tableController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

const tableSchema = Joi.object({
  branchId: Joi.string().required(),
  tableNumber: Joi.string().required(),
  capacity: Joi.number().integer().min(1).required()
});

router.get('/', tableController.getTables);
router.post('/', authenticate, authorize('admin'), validate(tableSchema), tableController.createTable);
router.put('/:id', authenticate, authorize('admin'), tableController.updateTable);
router.delete('/:id', authenticate, authorize('admin'), tableController.deleteTable);

module.exports = router;
