const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const Branch = require('../models/Branch');

exports.getManagerAnalytics = async (req, res, next) => {
  try {
    // 1. Revenue by Branch
    const revenueByBranch = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: '$branchId',
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branch'
        }
      },
      { $unwind: '$branch' },
      {
        $project: {
          branchId: '$_id',
          branchName: '$branch.name',
          totalRevenue: 1,
          totalOrders: 1
        }
      }
    ]);

    // 2. Popular Dishes Top Sellers
    const popularDishes = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalQuantitySold: { $sum: '$items.quantity' },
          totalItemRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 5 }
    ]);

    // 3. Peak Reservation Hours
    const peakHours = await Reservation.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $hour: '$dateTime' },
          totalReservations: { $sum: 1 }
        }
      },
      { $sort: { totalReservations: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        revenueByBranch,
        popularDishes,
        peakHours
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getBranchSalesReport = async (req, res, next) => {
  try {
    const branchSales = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: '$branchId',
          totalRevenue: { $sum: '$totalAmount' },
          totalTax: { $sum: '$taxAmount' },
          totalServiceCharge: { $sum: '$serviceCharge' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branch'
        }
      },
      { $unwind: '$branch' },
      {
        $project: {
          branchId: '$_id',
          branchName: '$branch.name',
          branchAddress: '$branch.address',
          totalRevenue: { $round: ['$totalRevenue', 2] },
          totalTax: { $round: ['$totalTax', 2] },
          totalServiceCharge: { $round: ['$totalServiceCharge', 2] },
          totalOrders: 1,
          averageOrderValue: { $round: ['$averageOrderValue', 2] }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: branchSales.length,
      data: branchSales
    });
  } catch (error) {
    next(error);
  }
};
