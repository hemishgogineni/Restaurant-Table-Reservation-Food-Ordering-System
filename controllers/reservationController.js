const Reservation = require('../models/Reservation');
const Table = require('../models/Table');

exports.reserveTable = async (req, res, next) => {
  try {
    const { branchId, tableId, dateTime, guestsCount } = req.body;
    const customerId = req.user.id;

    const reqDate = new Date(dateTime);
    if (isNaN(reqDate.getTime()) || reqDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or past date/time provided for reservation.',
        errorCode: 'INVALID_DATETIME'
      });
    }

    const table = await Table.findById(tableId);
    if (!table || table.branchId.toString() !== branchId) {
      return res.status(404).json({
        success: false,
        message: 'Table not found or does not belong to the selected branch.',
        errorCode: 'NOT_FOUND'
      });
    }

    if (table.capacity < guestsCount) {
      return res.status(400).json({
        success: false,
        message: `Selected table capacity (${table.capacity}) is less than guests count (${guestsCount}).`,
        errorCode: 'INSUFFICIENT_CAPACITY'
      });
    }

    // Prevents table double-booking: Check overlapping reservation slot (+/- 60 mins)
    const slotStart = new Date(reqDate.getTime() - 59 * 60 * 1000);
    const slotEnd = new Date(reqDate.getTime() + 59 * 60 * 1000);

    const conflictingReservation = await Reservation.findOne({
      tableId,
      status: { $in: ['pending', 'confirmed'] },
      dateTime: { $gte: slotStart, $lte: slotEnd }
    });

    if (conflictingReservation) {
      return res.status(409).json({
        success: false,
        message: 'Table double-booking conflict! The selected table is already reserved for this time slot.',
        errorCode: 'TABLE_SLOT_CONFLICT'
      });
    }

    const reservation = await Reservation.create({
      customerId,
      branchId,
      tableId,
      dateTime: reqDate,
      guestsCount,
      status: 'confirmed'
    });

    res.status(201).json({
      success: true,
      message: 'Table reserved successfully',
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

exports.getAvailableTables = async (req, res, next) => {
  try {
    const { branchId, dateTime, guestsCount } = req.query;
    if (!branchId || !dateTime) {
      return res.status(400).json({
        success: false,
        message: 'branchId and dateTime query parameters are required.',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    const reqDate = new Date(dateTime);
    const minGuests = parseInt(guestsCount || '1', 10);

    const slotStart = new Date(reqDate.getTime() - 59 * 60 * 1000);
    const slotEnd = new Date(reqDate.getTime() + 59 * 60 * 1000);

    // Find reserved tables in this time window
    const reserved = await Reservation.find({
      branchId,
      status: { $in: ['pending', 'confirmed'] },
      dateTime: { $gte: slotStart, $lte: slotEnd }
    }).select('tableId');

    const reservedTableIds = reserved.map((r) => r.tableId.toString());

    const availableTables = await Table.find({
      branchId,
      isAvailable: true,
      capacity: { $gte: minGuests },
      _id: { $nin: reservedTableIds }
    });

    res.status(200).json({
      success: true,
      count: availableTables.length,
      data: availableTables
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation record not found.',
        errorCode: 'NOT_FOUND'
      });
    }

    // Role check: Only customer owner or admin can cancel
    if (req.user.role === 'customer' && reservation.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You cannot cancel someone else\'s reservation.',
        errorCode: 'FORBIDDEN'
      });
    }

    // Policy Check: Cannot cancel within 1 hour of scheduled reservation time
    const now = new Date();
    const resTime = new Date(reservation.dateTime);
    const diffInMs = resTime.getTime() - now.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (req.user.role === 'customer' && diffInHours < 1.0) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation policy violation: Reservations cannot be cancelled within 1 hour of scheduled time.',
        errorCode: 'CANCELLATION_POLICY_VIOLATION'
      });
    }

    reservation.status = 'cancelled';
    reservation.cancellationReason = req.body.reason || 'Cancelled by customer';
    await reservation.save();

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully',
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

exports.getReservations = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'customer') {
      filter.customerId = req.user.id;
    } else if (req.query.branchId) {
      filter.branchId = req.query.branchId;
    }

    const reservations = await Reservation.find(filter)
      .populate('branchId', 'name')
      .populate('tableId', 'tableNumber capacity')
      .populate('customerId', 'name email phone')
      .sort({ dateTime: -1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    next(error);
  }
};

exports.rescheduleReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation record not found.',
        errorCode: 'NOT_FOUND'
      });
    }

    // Role check: Only customer owner or admin can reschedule
    if (req.user.role === 'customer' && reservation.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You cannot reschedule someone else's reservation.",
        errorCode: 'FORBIDDEN'
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule a cancelled reservation. Please make a new reservation.',
        errorCode: 'ALREADY_CANCELLED'
      });
    }

    // Policy Check: Cannot reschedule within 1 hour of scheduled reservation time
    const now = new Date();
    const currentResTime = new Date(reservation.dateTime);
    const diffInHours = (currentResTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (req.user.role === 'customer' && diffInHours < 1.0) {
      return res.status(400).json({
        success: false,
        message: 'Reschedule policy violation: Reservations cannot be rescheduled within 1 hour of scheduled time.',
        errorCode: 'RESCHEDULE_POLICY_VIOLATION'
      });
    }

    const { newDateTime, guestsCount, tableId } = req.body;
    const reqDate = new Date(newDateTime);
    if (isNaN(reqDate.getTime()) || reqDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or past date/time provided for rescheduling.',
        errorCode: 'INVALID_DATETIME'
      });
    }

    const targetTableId = tableId || reservation.tableId;
    const targetGuests = guestsCount || reservation.guestsCount;

    const table = await Table.findById(targetTableId);
    if (!table || table.branchId.toString() !== reservation.branchId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Table not found or does not belong to the reservation branch.',
        errorCode: 'NOT_FOUND'
      });
    }

    if (table.capacity < targetGuests) {
      return res.status(400).json({
        success: false,
        message: `Selected table capacity (${table.capacity}) is less than guests count (${targetGuests}).`,
        errorCode: 'INSUFFICIENT_CAPACITY'
      });
    }

    // Prevents table double-booking for the new slot
    const slotStart = new Date(reqDate.getTime() - 59 * 60 * 1000);
    const slotEnd = new Date(reqDate.getTime() + 59 * 60 * 1000);

    const conflictingReservation = await Reservation.findOne({
      _id: { $ne: reservation._id },
      tableId: targetTableId,
      status: { $in: ['pending', 'confirmed'] },
      dateTime: { $gte: slotStart, $lte: slotEnd }
    });

    if (conflictingReservation) {
      return res.status(409).json({
        success: false,
        message: 'Table double-booking conflict! The selected table is already reserved for this new time slot.',
        errorCode: 'TABLE_SLOT_CONFLICT'
      });
    }

    reservation.dateTime = reqDate;
    if (tableId) reservation.tableId = tableId;
    if (guestsCount) reservation.guestsCount = guestsCount;
    reservation.status = 'confirmed';
    await reservation.save();

    const updated = await Reservation.findById(reservation._id)
      .populate('branchId', 'name')
      .populate('tableId', 'tableNumber capacity');

    res.status(200).json({
      success: true,
      message: 'Reservation rescheduled successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerReservationHistory = async (req, res, next) => {
  try {
    let targetCustomerId = req.user.id;
    if (req.params.id) {
      targetCustomerId = req.params.id;
    } else if (req.params.customerId) {
      targetCustomerId = req.params.customerId;
    }

    const reservations = await Reservation.find({ customerId: targetCustomerId })
      .populate('branchId', 'name address phone')
      .populate('tableId', 'tableNumber capacity')
      .sort({ dateTime: -1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    next(error);
  }
};
