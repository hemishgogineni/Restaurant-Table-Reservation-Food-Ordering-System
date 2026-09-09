const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { calculateBilling } = require('../utils/billing');

exports.placeOrder = async (req, res, next) => {
  try {
    const { branchId, tableId, orderType, items, remarks } = req.body;
    const customerId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item.',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    const itemIds = items.map((i) => i.menuItemId);
    const dbMenuItems = await MenuItem.find({ _id: { $in: itemIds }, branchId, isAvailable: true });

    if (dbMenuItems.length !== itemIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected menu items are invalid or unavailable at this branch.',
        errorCode: 'ITEM_UNAVAILABLE'
      });
    }

    const menuMap = {};
    dbMenuItems.forEach((item) => {
      menuMap[item._id.toString()] = item;
    });

    const validatedItems = items.map((i) => {
      const dbItem = menuMap[i.menuItemId.toString()];
      return {
        menuItemId: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: i.quantity
      };
    });

    const billing = calculateBilling(validatedItems);

    const order = await Order.create({
      customerId,
      branchId,
      tableId: tableId || null,
      orderType: orderType || 'dine-in',
      items: billing.items,
      status: 'Placed',
      subtotal: billing.subtotal,
      taxAmount: billing.taxAmount,
      serviceCharge: billing.serviceCharge,
      totalAmount: billing.totalAmount,
      remarks: remarks || ''
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const allowedStatuses = ['Placed', 'Preparing', 'Ready', 'Served', 'Delivered', 'Cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status value. Allowed: ${allowedStatuses.join(', ')}`,
        errorCode: 'INVALID_STATUS'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order record not found',
        errorCode: 'NOT_FOUND'
      });
    }

    // Workflow State Machine: Enforce sequential transitions
    // Placed -> Preparing -> Ready -> Served / Delivered
    const validTransitions = {
      'Placed': ['Preparing', 'Cancelled'],
      'Preparing': ['Ready', 'Cancelled'],
      'Ready': ['Served', 'Delivered', 'Cancelled'],
      'Served': [],
      'Delivered': [],
      'Cancelled': []
    };

    if (order.status === status) {
      return res.status(200).json({
        success: true,
        message: `Order is already in status '${status}'`,
        data: {
          _id: order._id,
          status: order.status,
          remarks: order.remarks
        }
      });
    }

    const nextAllowed = validTransitions[order.status] || [];
    if (req.user && req.user.role !== 'admin' && !nextAllowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid workflow transition from '${order.status}' to '${status}'. Allowed next states: ${nextAllowed.length ? nextAllowed.join(', ') : 'None (Terminal state)'}`,
        errorCode: 'INVALID_STATUS_TRANSITION'
      });
    }

    order.status = status;
    if (remarks) order.remarks = remarks;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        _id: order._id,
        status: order.status,
        remarks: order.remarks
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderBill = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('branchId', 'name address phone')
      .populate('customerId', 'name email phone')
      .populate('tableId', 'tableNumber');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errorCode: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        branch: order.branchId,
        customer: order.customerId,
        table: order.tableId ? order.tableId.tableNumber : 'N/A (Takeaway)',
        orderType: order.orderType,
        items: order.items,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        serviceCharge: order.serviceCharge,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerOrderHistory = async (req, res, next) => {
  try {
    let targetCustomerId = req.user.id;
    if (req.params.id) {
      targetCustomerId = req.params.id;
    } else if (req.params.customerId) {
      targetCustomerId = req.params.customerId;
    }

    const orders = await Order.find({ customerId: targetCustomerId })
      .populate('branchId', 'name')
      .populate('tableId', 'tableNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('branchId', 'name')
      .populate('customerId', 'name email')
      .populate('tableId', 'tableNumber');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found', errorCode: 'NOT_FOUND' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
