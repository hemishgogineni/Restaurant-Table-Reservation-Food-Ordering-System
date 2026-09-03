const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

feedbackSchema.index({ orderId: 1 });
feedbackSchema.index({ branchId: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
