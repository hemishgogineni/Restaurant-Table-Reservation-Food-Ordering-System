const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['customer', 'kitchen', 'admin'],
      default: 'customer',
    },
    phone: { type: String, trim: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
