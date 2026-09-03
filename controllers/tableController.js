const Table = require('../models/Table');

exports.getTables = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.branchId) query.branchId = req.query.branchId;
    const tables = await Table.find(query).populate('branchId', 'name');
    res.status(200).json({ success: true, count: tables.length, data: tables });
  } catch (error) {
    next(error);
  }
};

exports.createTable = async (req, res, next) => {
  try {
    const { branchId, tableNumber, capacity } = req.body;
    const existing = await Table.findOne({ branchId, tableNumber });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A table with this table number already exists in this branch.',
        errorCode: 'DUPLICATE_TABLE'
      });
    }
    const table = await Table.create({ branchId, tableNumber, capacity });
    res.status(201).json({ success: true, message: 'Table added successfully', data: table });
  } catch (error) {
    next(error);
  }
};

exports.updateTable = async (req, res, next) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found', errorCode: 'NOT_FOUND' });
    }
    res.status(200).json({ success: true, message: 'Table updated successfully', data: table });
  } catch (error) {
    next(error);
  }
};

exports.deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found', errorCode: 'NOT_FOUND' });
    }
    res.status(200).json({ success: true, message: 'Table deleted successfully' });
  } catch (error) {
    next(error);
  }
};
