const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    dateTime: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    guestsCount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'confirmed'
    },
    cancellationReason: { type: String, default: null }
  },
  { timestamps: true }
);

reservationSchema.index({ customerId: 1 });
reservationSchema.index({ branchId: 1, dateTime: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
