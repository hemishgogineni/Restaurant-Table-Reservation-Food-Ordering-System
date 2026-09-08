const API_BASE = '/api';
let currentRole = 'customer';
let currentToken = '';
let currentBranchId = '';
let cart = [];

document.addEventListener('DOMContentLoaded', async () => {
  const storedToken = localStorage.getItem('authToken');
  const storedRole = localStorage.getItem('userRole') || 'customer';

  if (!storedToken) {
    window.location.href = '/login';
    return;
  }

  currentToken = storedToken;
  currentRole = ['customer', 'kitchen', 'admin'].includes(storedRole) ? storedRole : 'customer';
  updateAuthStatus();
  updateRoleVisibility(currentRole);
  const orderPanel = document.getElementById('customer-order-panel');
  if (orderPanel && currentRole !== 'customer') orderPanel.remove();
  document.getElementById('tab-history')?.addEventListener('click', loadHistory);
  await loadBranches();
  await loadMenu();

  if (currentRole === 'kitchen') {
    document.getElementById('tab-kitchen').click();
    loadKitchenQueue();
  } else if (currentRole === 'admin') {
    document.getElementById('tab-admin').click();
    loadManagerAnalytics();
    loadKitchenQueue();
  }

  // Set default reservation datetime to 2 hours from now
  const now = new Date();
  now.setHours(now.getHours() + 2);
  document.getElementById('resDateTime').value = now.toISOString().slice(0, 16);
});

function updateAuthStatus(name = '') {
  const badge = document.querySelector('.badge-text');
  if (!badge) return;
  const email = localStorage.getItem('userEmail') || '';
  const identity = name || email || 'User';
  badge.innerText = `Logged in as: ${currentRole.toUpperCase()} (${identity})`;
}

function updateRoleVisibility(role) {
  const reserveTab = document.getElementById('tab-reserve')?.closest('.nav-item');
  const kitchenTab = document.getElementById('tab-kitchen')?.closest('.nav-item');
  const adminTab = document.getElementById('tab-admin')?.closest('.nav-item');
  const historyTab = document.getElementById('tab-history')?.closest('.nav-item');
  if (role !== 'customer') reserveTab?.remove();
  if (!['kitchen', 'admin'].includes(role)) kitchenTab?.remove();
  if (role !== 'admin') adminTab?.remove();
  if (role === 'kitchen') historyTab?.remove();

  if (role === 'kitchen') {
    document.getElementById('tab-kitchen')?.click();
  } else if (role === 'admin') {
    document.getElementById('tab-admin')?.click();
  } else {
    document.getElementById('tab-menu')?.click();
  }
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  currentToken = '';
  window.location.href = '/login';
}

async function loadBranches() {
  try {
    const res = await fetch(`${API_BASE}/branches`);
    const data = await res.json();
    if (data.success && data.data.length > 0) {
      currentBranchId = data.data[0]._id;

      const branchSelects = [document.getElementById('branchFilter'), document.getElementById('resBranch')];
      branchSelects.forEach((select) => {
        if (!select) return;
        select.innerHTML = data.data.map((b) => `<option value="${b._id}">${b.name}</option>`).join('');
      });
      fetchAvailableTables();
    }
  } catch (err) {
    console.error('Error loading branches:', err);
  }
}

async function loadMenu() {
  const container = document.getElementById('menuItemsContainer');
  const branchId = document.getElementById('branchFilter').value || currentBranchId;

  try {
    const res = await fetch(`${API_BASE}/menu?branchId=${branchId}&availableOnly=true`);
    const data = await res.json();

    if (!data.success || data.data.length === 0) {
      container.innerHTML = `<p class="text-muted text-center py-4">No menu items found for this branch.</p>`;
      return;
    }

    container.innerHTML = data.data
      .map(
        (item) => `
      <div class="col-md-6">
        <div class="card h-100 border shadow-sm">
          <div class="card-body d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-start">
                <h6 class="fw-bold mb-1">${item.name}</h6>
                <span class="badge bg-secondary">${item.category}</span>
              </div>
              <p class="text-muted small mb-2">${item.description || 'Delicious dish'}</p>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <span class="fs-5 fw-bold text-success">₹${item.price}</span>
              ${currentRole === 'customer' ? `
                <button class="btn btn-sm btn-outline-primary fw-bold" onclick="addToCart('${item._id}', '${item.name}', ${item.price})">
                  <i class="fa-solid fa-plus me-1"></i> Add
                </button>
              ` : '<span class="text-muted small">Ordering restricted to customers</span>'}
            </div>
          </div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to load menu items.</div>`;
  }
}

function addToCart(id, name, price) {
  const existing = cart.find((i) => i.menuItemId === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ menuItemId: id, name, price, quantity: 1 });
  }
  updateCartUI();
  showToast(`Added ${name} to cart`);
}

function updateCartUI() {
  const cartList = document.getElementById('cartItemsList');
  if (cart.length === 0) {
    cartList.innerHTML = `<p class="text-muted text-center py-3">Your cart is currently empty.</p>`;
    document.getElementById('cartSubtotal').innerText = '0.00';
    document.getElementById('cartTax').innerText = '0.00';
    document.getElementById('cartService').innerText = '0.00';
    document.getElementById('cartTotal').innerText = '0.00';
    return;
  }

  let subtotal = 0;
  cartList.innerHTML = cart
    .map((item) => {
      const itemSub = item.price * item.quantity;
      subtotal += itemSub;
      return `
      <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
        <div>
          <strong class="d-block">${item.name}</strong>
          <small class="text-muted">₹${item.price} x ${item.quantity}</small>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="fw-bold">₹${itemSub.toFixed(2)}</span>
          <button class="btn btn-sm btn-light text-danger" onclick="removeFromCart('${item.menuItemId}')">&times;</button>
        </div>
      </div>
    `;
    })
    .join('');

  const tax = subtotal * 0.05;
  const service = subtotal * 0.05;
  const total = subtotal + tax + service;

  document.getElementById('cartSubtotal').innerText = subtotal.toFixed(2);
  document.getElementById('cartTax').innerText = tax.toFixed(2);
  document.getElementById('cartService').innerText = service.toFixed(2);
  document.getElementById('cartTotal').innerText = total.toFixed(2);
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.menuItemId !== id);
  updateCartUI();
}

async function placeFoodOrder() {
  if (cart.length === 0) {
    showToast('Your cart is empty!', 'bg-danger');
    return;
  }

  const branchId = document.getElementById('branchFilter').value || currentBranchId;

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        branchId,
        orderType: 'dine-in',
        items: cart.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        remarks: 'Order from CIA-3 Live Frontend Demo'
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast(`Order Placed Successfully! ID: ${data.data._id}`);
      cart = [];
      updateCartUI();
      loadHistory();
    } else {
      showToast(data.message, 'bg-danger');
    }
  } catch (err) {
    showToast('Error placing order', 'bg-danger');
  }
}

async function fetchAvailableTables() {
  const branchId = document.getElementById('resBranch').value || currentBranchId;
  const dateTime = document.getElementById('resDateTime').value;
  const guestsCount = document.getElementById('resGuests').value;

  if (!branchId || !dateTime) return;

  try {
    const res = await fetch(`${API_BASE}/reservations/available-tables?branchId=${branchId}&dateTime=${dateTime}&guestsCount=${guestsCount}`);
    const data = await res.json();

    const tableSelect = document.getElementById('resTable');
    if (data.success && data.data.length > 0) {
      tableSelect.innerHTML = data.data.map((t) => `<option value="${t._id}">Table ${t.tableNumber} (Capacity: ${t.capacity})</option>`).join('');
    } else {
      tableSelect.innerHTML = `<option value="">No tables available for this time slot (Conflict Validation)</option>`;
    }
  } catch (err) {
    console.error('Error fetching tables:', err);
  }
}

async function handleReserveTable(e) {
  e.preventDefault();
  const branchId = document.getElementById('resBranch').value;
  const tableId = document.getElementById('resTable').value;
  const dateTime = document.getElementById('resDateTime').value;
  const guestsCount = document.getElementById('resGuests').value;

  if (!tableId) {
    showToast('Please select a valid table slot!', 'bg-danger');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify({ branchId, tableId, dateTime, guestsCount: parseInt(guestsCount, 10) })
    });

    const data = await res.json();
    if (data.success) {
      showToast('Table Reserved Successfully!');
      fetchAvailableTables();
    } else {
      showToast(data.message, 'bg-danger');
    }
  } catch (err) {
    showToast('Reservation Error', 'bg-danger');
  }
}

async function loadKitchenQueue() {
  const container = document.getElementById('kitchenOrdersQueue');
  try {
    const res = await fetch(`${API_BASE}/kitchen/queue`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    const data = await res.json();

    if (!data.success || data.data.length === 0) {
      container.innerHTML = `<div class="col-12 text-center py-4 text-muted">No pending orders in kitchen queue.</div>`;
      return;
    }

    container.innerHTML = data.data
      .map(
        (order) => `
      <div class="col-md-6 col-lg-4">
        <div class="card kitchen-card ${order.status === 'Preparing' ? 'preparing' : ''} shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="fw-bold mb-0">Order #${order._id.slice(-6)}</h6>
              <span class="badge ${order.status === 'Placed' ? 'bg-warning text-dark' : 'bg-primary'}">${order.status}</span>
            </div>
            <p class="small text-muted mb-2">Placed: ${new Date(order.createdAt).toLocaleTimeString()}</p>
            <ul class="list-unstyled mb-3 border-top border-bottom py-2 small">
              ${order.items.map((i) => `<li><strong>${i.quantity}x</strong> ${i.name}</li>`).join('')}
            </ul>
            <div class="d-flex gap-2">
              ${
                order.status === 'Placed'
                  ? `<button class="btn btn-sm btn-primary w-100 fw-bold" onclick="updateOrderStatus('${order._id}', 'Preparing')">Start Preparing</button>`
                  : `<button class="btn btn-sm btn-success w-100 fw-bold" onclick="updateOrderStatus('${order._id}', 'Ready')">Mark Ready</button>`
              }
            </div>
          </div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Error loading kitchen queue. Ensure you are logged in as Kitchen Staff or Admin.</div>`;
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify({ status, remarks: `Updated by ${currentRole}` })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Order status updated to ${status}`);
      loadKitchenQueue();
    }
  } catch (err) {
    showToast('Failed to update status', 'bg-danger');
  }
}

async function loadHistory() {
  const tbody = document.getElementById('historyTableBody');
  const refreshButton = document.getElementById('refresh-history-btn');
  if (refreshButton) {
    refreshButton.disabled = true;
    refreshButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i>Loading';
  }

  try {
    const res = await fetch(`${API_BASE}/orders/my-history`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    const data = await res.json();

    if (res.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
      return;
    }

    if (!data.success || data.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No past orders found.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.data
      .map(
        (o) => `
      <tr>
        <td><code>#${o._id.slice(-6)}</code></td>
        <td>${new Date(o.createdAt).toLocaleDateString()}</td>
        <td>${o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}</td>
        <td class="fw-bold">₹${o.totalAmount}</td>
        <td><span class="badge bg-secondary">${o.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-info" onclick="viewBill('${o._id}')">
            <i class="fa-solid fa-file-invoice"></i> Bill Summary
          </button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger text-center">Error loading order history.</td></tr>`;
  } finally {
    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.innerHTML = '<i class="fa-solid fa-refresh me-1"></i>Refresh';
    }
  }
}

async function viewBill(orderId) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/bill`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success) {
      const b = data.data;
      alert(`================ BILL SUMMARY ================
Branch: ${b.branch.name}
Order ID: ${b.orderId}
Subtotal: ₹${b.subtotal}
GST Tax (5%): ₹${b.taxAmount}
Service Charge (5%): ₹${b.serviceCharge}
---------------------------------------------
TOTAL AMOUNT PAID: ₹${b.totalAmount}
Status: ${b.status}
=============================================`);
    }
  } catch (err) {
    showToast('Failed to load bill', 'bg-danger');
  }
}

async function loadManagerAnalytics() {
  const container = document.getElementById('analyticsContainer');
  try {
    const res = await fetch(`${API_BASE}/manager/reports/analytics`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = `<div class="alert alert-warning">Manager role required to view reports.</div>`;
      return;
    }

    const { revenueByBranch, popularDishes, peakHours } = data.data;

    container.innerHTML = `
      <div class="row g-4">
        <div class="col-md-6">
          <div class="card h-100 border-0 shadow-sm bg-light">
            <div class="card-body">
              <h6 class="fw-bold text-primary mb-3"><i class="fa-solid fa-building me-2"></i> Revenue by Branch</h6>
              <ul class="list-group">
                ${
                  revenueByBranch.length > 0
                    ? revenueByBranch
                        .map(
                          (b) => `
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${b.branchName}
                    <span class="badge bg-success rounded-pill fs-6">₹${b.totalRevenue} (${b.totalOrders} orders)</span>
                  </li>
                `
                        )
                        .join('')
                    : '<li class="list-group-item">No revenue data recorded yet.</li>'
                }
              </ul>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card h-100 border-0 shadow-sm bg-light">
            <div class="card-body">
              <h6 class="fw-bold text-danger mb-3"><i class="fa-solid fa-fire me-2"></i> Top Selling Dishes</h6>
              <ul class="list-group">
                ${
                  popularDishes.length > 0
                    ? popularDishes
                        .map(
                          (d) => `
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${d._id}
                    <span class="badge bg-danger rounded-pill fs-6">${d.totalQuantitySold} sold (₹${d.totalItemRevenue})</span>
                  </li>
                `
                        )
                        .join('')
                    : '<li class="list-group-item">No dish sales data yet.</li>'
                }
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Error loading manager reports. Switch role to Admin/Manager.</div>`;
  }
}

async function seedDatabase() {
  try {
    showToast('Seeding database with sample demo records...');
    await fetch(`${API_BASE}/branches`);
    await loadBranches();
    await loadMenu();
    showToast('Database Seeded Successfully!');
  } catch (err) {
    showToast('Seeding triggered', 'bg-info');
  }
}

function showToast(message, bgClass = 'bg-success') {
  const toastEl = document.getElementById('liveToast');
  toastEl.className = `toast align-items-center text-white ${bgClass} border-0 shadow`;
  document.getElementById('toastMessage').innerText = message;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
