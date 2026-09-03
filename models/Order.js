const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
    orderType: { type: String, enum: ['dine-in', 'takeaway'], default: 'dine-in' },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ['Placed', 'Preparing', 'Ready', 'Served', 'Delivered', 'Cancelled'],
      default: 'Placed'
    },
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    serviceCharge: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    remarks: { type: String, default: '' }
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1 });
orderSchema.index({ branchId: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
