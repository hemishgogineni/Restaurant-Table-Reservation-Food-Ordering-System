const Branch = require('../models/Branch');

exports.getBranches = async (req, res, next) => {
  try {
    const branches = await Branch.find({ isAvailable: true });
    res.status(200).json({
      success: true,
      count: branches.length,
      data: branches
    });
  } catch (error) {
    next(error);
  }
};

exports.getBranchById = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch location not found.',
        errorCode: 'NOT_FOUND'
      });
    }
    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

exports.createBranch = async (req, res, next) => {
  try {
    const { name, address, seatingCapacity, phone } = req.body;
    const branch = await Branch.create({ name, address, seatingCapacity, phone });
    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: branch
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch location not found for update.',
        errorCode: 'NOT_FOUND'
      });
    }
    res.status(200).json({ success: true, message: 'Branch updated successfully', data: branch });
  } catch (error) {
    next(error);
  }
};

exports.deleteBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, { isAvailable: false }, { new: true });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found', errorCode: 'NOT_FOUND' });
    }
    res.status(200).json({ success: true, message: 'Branch deactivated successfully' });
  } catch (error) {
    next(error);
  }
};
