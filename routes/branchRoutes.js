const express = require('express');
const router = express.Router();
const Joi = require('joi');
const branchController = require('../controllers/branchController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

const branchSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  seatingCapacity: Joi.number().integer().min(1).required(),
  phone: Joi.string().allow('', null)
});

router.get('/', branchController.getBranches);
router.get('/:id', branchController.getBranchById);
router.post('/', authenticate, authorize('admin'), validate(branchSchema), branchController.createBranch);
router.put('/:id', authenticate, authorize('admin'), branchController.updateBranch);
router.delete('/:id', authenticate, authorize('admin'), branchController.deleteBranch);

module.exports = router;
