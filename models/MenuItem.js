const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    dietaryPreference: { type: String, enum: ['Veg', 'Non-Veg', 'Vegan', 'Gluten-Free'], default: 'Non-Veg' },
    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: true }
);

menuItemSchema.index({ branchId: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
