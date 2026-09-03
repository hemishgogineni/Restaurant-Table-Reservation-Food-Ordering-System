const express = require('express');
const router = express.Router();
const Joi = require('joi');
const feedbackController = require('../controllers/feedbackController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const feedbackSchema = Joi.object({
  orderId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().allow('', null)
});

router.post('/', authenticate, validate(feedbackSchema), feedbackController.submitFeedback);
router.get('/branch/:branchId', feedbackController.getBranchFeedback);

module.exports = router;
