const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    seatingCapacity: { type: Number, required: true, min: 1 },
    phone: { type: String, trim: true },
    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: true }
);

branchSchema.index({ name: 1 });

module.exports = mongoose.model('Branch', branchSchema);
