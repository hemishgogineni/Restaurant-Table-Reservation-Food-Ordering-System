const Feedback = require('../models/Feedback');
const Order = require('../models/Order');

exports.submitFeedback = async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;
    const customerId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errorCode: 'NOT_FOUND'
      });
    }

    if (order.customerId.toString() !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only provide feedback for your own orders.',
        errorCode: 'FORBIDDEN'
      });
    }

    const existing = await Feedback.findOne({ orderId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Feedback already submitted for this order.',
        errorCode: 'DUPLICATE_FEEDBACK'
      });
    }

    const feedback = await Feedback.create({
      orderId,
      customerId,
      branchId: order.branchId,
      rating,
      comment: comment || ''
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been recorded.',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

exports.getBranchFeedback = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const feedbackList = await Feedback.find({ branchId })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });

    let totalRating = 0;
    feedbackList.forEach((f) => (totalRating += f.rating));
    const avgRating = feedbackList.length > 0 ? (totalRating / feedbackList.length).toFixed(1) : 'N/A';

    res.status(200).json({
      success: true,
      count: feedbackList.length,
      averageRating: avgRating,
      data: feedbackList
    });
  } catch (error) {
    next(error);
  }
};
