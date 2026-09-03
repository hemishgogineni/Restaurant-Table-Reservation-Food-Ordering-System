const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    tableNumber: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },
    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: true }
);

tableSchema.index({ branchId: 1 });
tableSchema.index({ branchId: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
