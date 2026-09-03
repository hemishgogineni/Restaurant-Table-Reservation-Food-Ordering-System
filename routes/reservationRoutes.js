const express = require('express');
const router = express.Router();
const Joi = require('joi');
const reservationController = require('../controllers/reservationController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const reservationSchema = Joi.object({
  branchId: Joi.string().required(),
  tableId: Joi.string().required(),
  dateTime: Joi.date().iso().required(),
  guestsCount: Joi.number().integer().min(1).required()
});

router.post('/', authenticate, validate(reservationSchema), reservationController.reserveTable);
router.get('/available-tables', reservationController.getAvailableTables);
router.get('/', authenticate, reservationController.getReservations);
router.put('/:id/cancel', authenticate, reservationController.cancelReservation);

module.exports = router;
