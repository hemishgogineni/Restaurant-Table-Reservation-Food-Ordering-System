const Order = require('../models/Order');

exports.getKitchenQueue = async (req, res, next) => {
  try {
    const filter = {
      status: { $in: ['Placed', 'Preparing'] }
    };

    if (req.query.branchId) {
      filter.branchId = req.query.branchId;
    } else if (req.user.branchId) {
      filter.branchId = req.user.branchId;
    }

    // Kitchen Queue sorted by oldest first (ASC)
    const queue = await Order.find(filter)
      .populate('branchId', 'name')
      .populate('tableId', 'tableNumber')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: queue.length,
      data: queue
    });
  } catch (error) {
    next(error);
  }
};
