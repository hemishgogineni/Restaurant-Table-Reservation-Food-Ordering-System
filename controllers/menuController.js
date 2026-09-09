const MenuItem = require('../models/MenuItem');

exports.getMenu = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.branchId) filter.branchId = req.query.branchId;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.dietaryPreference) filter.dietaryPreference = req.query.dietaryPreference;
    if (req.query.availableOnly === 'true') filter.isAvailable = true;

    const items = await MenuItem.find(filter).populate('branchId', 'name');
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

exports.getMenuItemById = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
        errorCode: 'NOT_FOUND'
      });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

exports.createMenuItem = async (req, res, next) => {
  try {
    const { branchId, name, category, price, description, dietaryPreference, isAvailable } = req.body;
    const item = await MenuItem.create({ branchId, name, category, price, description, dietaryPreference, isAvailable });
    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: item
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found', errorCode: 'NOT_FOUND' });
    }
    res.status(200).json({ success: true, message: 'Menu item updated successfully', data: item });
  } catch (error) {
    next(error);
  }
};

exports.deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found', errorCode: 'NOT_FOUND' });
    }
    res.status(200).json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    next(error);
  }
};
