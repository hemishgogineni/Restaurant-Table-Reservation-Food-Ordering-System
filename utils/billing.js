const calculateBilling = (items) => {
  const taxRate = parseFloat(process.env.TAX_RATE || '0.05');
  const serviceChargeRate = parseFloat(process.env.SERVICE_CHARGE_RATE || '0.05');

  let subtotal = 0;
  const processedItems = items.map((item) => {
    const itemSubtotal = item.price * item.quantity;
    subtotal += itemSubtotal;
    return {
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: itemSubtotal
    };
  });

  const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
  const serviceCharge = parseFloat((subtotal * serviceChargeRate).toFixed(2));
  const totalAmount = parseFloat((subtotal + taxAmount + serviceCharge).toFixed(2));

  return {
    items: processedItems,
    subtotal,
    taxAmount,
    serviceCharge,
    totalAmount
  };
};

module.exports = { calculateBilling };
