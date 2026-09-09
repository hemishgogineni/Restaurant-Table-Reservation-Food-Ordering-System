const API_BASE = '/api';
let currentRole = 'customer';
let currentToken = '';
let currentBranchId = '';
let currentMenuCatalog = [];
let activeDietaryFilter = 'All';
let orderType = 'dine-in';
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

  await loadBranches();
  await loadMenu();

  if (currentRole === 'customer') {
    loadCustomerReservations();
    loadHistory();
  } else if (currentRole === 'kitchen') {
    document.getElementById('tab-kitchen')?.click();
    loadKitchenQueue();
  } else if (currentRole === 'admin') {
    document.getElementById('tab-admin')?.click();
    loadManagerAnalytics();
    loadKitchenQueue();
  }

  // Set default reservation datetime to 2 hours from now
  const now = new Date();
  now.setHours(now.getHours() + 2);
  const dateInput = document.getElementById('resDateTime');
  if (dateInput) {
    dateInput.value = now.toISOString().slice(0, 16);
  }
});

function updateAuthStatus() {
  const badge = document.querySelector('.badge-text');
  if (!badge) return;
  const userName = localStorage.getItem('userName') || '';
  const email = localStorage.getItem('userEmail') || '';
  const roleLabel = currentRole === 'admin' ? 'Executive Admin' : currentRole === 'kitchen' ? 'Kitchen Display' : 'Guest Account';
  badge.innerText = `${roleLabel} (${userName || email.split('@')[0]})`;
}

function updateRoleVisibility(role) {
  const reserveTab = document.getElementById('tab-reserve')?.closest('.nav-item');
  const kitchenTab = document.getElementById('tab-kitchen')?.closest('.nav-item');
  const adminTab = document.getElementById('tab-admin')?.closest('.nav-item');
  const historyTab = document.getElementById('tab-history')?.closest('.nav-item');
  const orderPanel = document.getElementById('customer-order-panel');

  if (role !== 'customer') {
    reserveTab?.remove();
    orderPanel?.remove();
  }
  if (!['kitchen', 'admin'].includes(role)) {
    kitchenTab?.remove();
  }
  if (role !== 'admin') {
    adminTab?.remove();
  }
  if (role === 'kitchen') {
    historyTab?.remove();
  }
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  currentToken = '';
  window.location.href = '/login';
}

function setOrderType(type) {
  orderType = type;
  document.getElementById('orderTypeDineIn')?.classList.toggle('active', type === 'dine-in');
  document.getElementById('orderTypeTakeaway')?.classList.toggle('active', type === 'takeaway');
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
  const branchId = document.getElementById('branchFilter')?.value || currentBranchId;

  try {
    const res = await fetch(`${API_BASE}/menu?branchId=${branchId}&availableOnly=true`);
    const data = await res.json();

    if (!data.success || data.data.length === 0) {
      container.innerHTML = `<div class="col-12 text-center py-5 text-muted">No dishes currently available for this location.</div>`;
      currentMenuCatalog = [];
      return;
    }

    currentMenuCatalog = data.data;
    renderMenuCatalog();
  } catch (err) {
    container.innerHTML = `<div class="col-12 text-center py-4 text-danger">Unable to load menu catalog.</div>`;
  }
}

function filterMenuByDietary(filter, btn) {
  activeDietaryFilter = filter;
  const parent = btn.parentElement;
  if (parent) {
    parent.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderMenuCatalog();
}

function renderMenuCatalog() {
  const container = document.getElementById('menuItemsContainer');
  if (!container) return;

  let filtered = currentMenuCatalog;
  if (activeDietaryFilter === 'Veg') {
    filtered = currentMenuCatalog.filter((i) => i.dietaryPreference === 'Veg' || i.category.toLowerCase().includes('veg'));
  } else if (activeDietaryFilter === 'Non-Veg') {
    filtered = currentMenuCatalog.filter((i) => i.dietaryPreference !== 'Veg' && !i.category.toLowerCase().includes('veg'));
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-12 text-center py-5 text-muted">No dishes match the selected dietary filter.</div>`;
    return;
  }

  container.innerHTML = filtered.map((item) => {
    const isVeg = item.dietaryPreference === 'Veg' || item.category.toLowerCase().includes('veg');
    return `
      <div class="col-md-6">
        <div class="dish-card">
          <div>
            <div class="dish-header">
              <div class="dish-name">${item.name}</div>
              <span class="dietary-tag ${isVeg ? 'veg' : 'non-veg'}">
                <span class="dietary-dot ${isVeg ? 'veg' : 'non-veg'}"></span>
                ${isVeg ? 'Veg' : 'Non-Veg'}
              </span>
            </div>
            <div class="dish-desc">${item.description || item.category}</div>
          </div>
          <div class="dish-footer">
            <span class="dish-price">₹${item.price.toFixed(2)}</span>
            ${currentRole === 'customer' ? `
              <button class="btn-luxury-secondary" style="padding: 0.35rem 0.85rem; font-size: 0.8rem;" onclick="addToCart('${item._id}', '${item.name.replace(/'/g, "\\'")}', ${item.price})">
                <i class="fa-solid fa-plus me-1" style="font-size: 0.75rem;"></i> Add
              </button>
            ` : '<span class="text-muted small">Customer Only</span>'}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function addToCart(id, name, price) {
  const existing = cart.find((i) => i.menuItemId === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ menuItemId: id, name, price, quantity: 1 });
  }
  updateCartUI();
  showToast(`Added ${name} to order slip`);
}

function changeCartQty(id, delta) {
  const item = cart.find((i) => i.menuItemId === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter((i) => i.menuItemId !== id);
  }
  updateCartUI();
}

function updateCartUI() {
  const cartList = document.getElementById('cartItemsList');
  const countBadge = document.getElementById('cartCountBadge');
  if (!cartList) return;

  const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);
  if (countBadge) countBadge.innerText = `${totalItems} Item${totalItems === 1 ? '' : 's'}`;

  if (cart.length === 0) {
    cartList.innerHTML = `<p class="text-center text-muted py-4 small">Your order slip is empty.<br>Select items from the catalog to begin.</p>`;
    document.getElementById('cartSubtotal').innerText = '0.00';
    document.getElementById('cartTax').innerText = '0.00';
    document.getElementById('cartService').innerText = '0.00';
    document.getElementById('cartTotal').innerText = '0.00';
    return;
  }

  let subtotal = 0;
  cartList.innerHTML = cart.map((item) => {
    const itemSub = item.price * item.quantity;
    subtotal += itemSub;
    return `
      <div class="order-slip-row">
        <div>
          <div class="fw-semibold text-dark">${item.name}</div>
          <small class="text-muted">₹${item.price.toFixed(2)} each</small>
        </div>
        <div class="d-flex align-items-center gap-3">
          <div class="qty-control">
            <button type="button" class="qty-btn" onclick="changeCartQty('${item.menuItemId}', -1)">−</button>
            <span class="qty-val">${item.quantity}</span>
            <button type="button" class="qty-btn" onclick="changeCartQty('${item.menuItemId}', 1)">+</button>
          </div>
          <span class="fw-semibold" style="min-width: 60px; text-align: right;">₹${itemSub.toFixed(2)}</span>
        </div>
      </div>
    `;
  }).join('');

  const tax = subtotal * 0.05;
  const service = subtotal * 0.05;
  const total = subtotal + tax + service;

  document.getElementById('cartSubtotal').innerText = subtotal.toFixed(2);
  document.getElementById('cartTax').innerText = tax.toFixed(2);
  document.getElementById('cartService').innerText = service.toFixed(2);
  document.getElementById('cartTotal').innerText = total.toFixed(2);
}

async function placeFoodOrder() {
  if (cart.length === 0) {
    showToast('Your order slip is empty', true);
    return;
  }

  const branchId = document.getElementById('branchFilter')?.value || currentBranchId;

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        branchId,
        orderType: orderType || 'dine-in',
        items: cart.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        remarks: 'Direct dining order'
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast('Order confirmed successfully');
      cart = [];
      updateCartUI();
      loadHistory();
    } else {
      showToast(data.message || 'Order failed', true);
    }
  } catch (err) {
    showToast('Error placing order', true);
  }
}

async function fetchAvailableTables() {
  const branchId = document.getElementById('resBranch')?.value || currentBranchId;
  const dateTime = document.getElementById('resDateTime')?.value;
  const guestsCount = document.getElementById('resGuests')?.value || 4;

  if (!branchId || !dateTime) return;

  try {
    const res = await fetch(`${API_BASE}/reservations/available-tables?branchId=${branchId}&dateTime=${dateTime}&guestsCount=${guestsCount}`);
    const data = await res.json();

    const tableSelect = document.getElementById('resTable');
    if (data.success && data.data.length > 0) {
      tableSelect.innerHTML = data.data.map((t) => `<option value="${t._id}">Table ${t.tableNumber} (Capacity: ${t.capacity} guests)</option>`).join('');
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
    showToast('Please select a valid table allocation', true);
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
      showToast('Table reservation confirmed');
      fetchAvailableTables();
      loadCustomerReservations();
    } else {
      showToast(data.message || 'Slot collision conflict', true);
    }
  } catch (err) {
    showToast('Reservation Error', true);
  }
}

async function loadCustomerReservations() {
  const tbody = document.getElementById('customerReservationsBody');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_BASE}/reservations`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    const data = await res.json();

    if (!data.success || data.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No scheduled reservations found.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.data.map((r) => {
      const dt = new Date(r.dateTime);
      const isCancelled = r.status === 'cancelled';
      const branchName = r.branchId?.name || 'Central Branch';
      const tableNum = r.tableId?.tableNumber || 'Assigned';

      return `
        <tr>
          <td class="fw-semibold">${dt.toLocaleDateString()} at ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          <td>${branchName}</td>
          <td>Table ${tableNum}</td>
          <td>${r.guestsCount} Guests</td>
          <td><span class="badge-status ${r.status}">${r.status}</span></td>
          <td>
            ${!isCancelled ? `
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-luxury-secondary" onclick="openRescheduleModal('${r._id}', '${r.dateTime}', ${r.guestsCount})">
                  Reschedule
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="cancelReservation('${r._id}')">
                  Cancel
                </button>
              </div>
            ` : '<span class="text-muted small">Cancelled</span>'}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-danger">Failed to load reservations.</td></tr>`;
  }
}

function openRescheduleModal(id, currentDateTime, currentGuests) {
  document.getElementById('rescheduleId').value = id;
  const dt = new Date(currentDateTime);
  document.getElementById('rescheduleDateTime').value = dt.toISOString().slice(0, 16);
  document.getElementById('rescheduleGuests').value = currentGuests || 4;
  new bootstrap.Modal(document.getElementById('rescheduleModal')).show();
}

async function handleRescheduleSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('rescheduleId').value;
  const newDateTime = document.getElementById('rescheduleDateTime').value;
  const guestsCount = parseInt(document.getElementById('rescheduleGuests').value, 10);

  try {
    const res = await fetch(`${API_BASE}/reservations/${id}/reschedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify({ newDateTime, guestsCount })
    });

    const data = await res.json();
    if (data.success) {
      showToast('Reservation rescheduled successfully');
      bootstrap.Modal.getInstance(document.getElementById('rescheduleModal'))?.hide();
      loadCustomerReservations();
    } else {
      showToast(data.message || 'Reschedule conflict', true);
    }
  } catch (err) {
    showToast('Failed to reschedule reservation', true);
  }
}

async function cancelReservation(id) {
  if (!confirm('Are you sure you wish to cancel this reservation? (Enforces 1-hour cancellation policy)')) return;

  try {
    const res = await fetch(`${API_BASE}/reservations/${id}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify({ reason: 'Cancelled by guest request' })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Reservation cancelled successfully');
      loadCustomerReservations();
    } else {
      showToast(data.message || 'Cancellation policy rejected', true);
    }
  } catch (err) {
    showToast('Error cancelling reservation', true);
  }
}

async function loadKitchenQueue() {
  const container = document.getElementById('kitchenOrdersQueue');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/kitchen/queue`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    const data = await res.json();

    if (!data.success || data.data.length === 0) {
      container.innerHTML = `<div class="col-12 text-center py-5 text-muted">No pending tickets in queue. All orders served.</div>`;
      return;
    }

    container.innerHTML = data.data.map((order) => {
      const placedTime = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nextAction = order.status === 'Placed' ? 'Preparing' : order.status === 'Preparing' ? 'Ready' : 'Served';

      return `
        <div class="col-md-6 col-lg-4">
          <div class="kitchen-ticket">
            <div>
              <div class="ticket-meta">
                <span class="ticket-number">Ticket #${order._id.slice(-6).toUpperCase()}</span>
                <span class="badge-status ${order.status.toLowerCase()}">${order.status}</span>
              </div>
              <div class="d-flex justify-content-between text-muted small mb-2">
                <span>Type: ${order.orderType === 'dine-in' ? 'Dine-In' : 'Takeaway'}</span>
                <span>Time: ${placedTime}</span>
              </div>
              <div class="border-top border-bottom py-2 my-2">
                ${order.items.map((i) => `
                  <div class="ticket-item">
                    <span class="fw-semibold">${i.name}</span>
                    <span class="text-muted">x${i.quantity}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="pt-3">
              <button class="btn-luxury-primary w-100" onclick="updateOrderStatus('${order._id}', '${nextAction}')">
                Advance to ${nextAction}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="col-12 text-center py-4 text-danger">Error loading kitchen queue. Kitchen or Admin credentials required.</div>`;
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
      body: JSON.stringify({ status, remarks: `Transitioned to ${status}` })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Order updated to ${status}`);
      loadKitchenQueue();
    } else {
      showToast(data.message || 'Status transition rejected', true);
    }
  } catch (err) {
    showToast('Failed to update status', true);
  }
}

async function loadHistory() {
  const tbody = document.getElementById('historyTableBody');
  const refreshButton = document.getElementById('refresh-history-btn');
  if (refreshButton) {
    refreshButton.disabled = true;
  }

  try {
    const res = await fetch(`${API_BASE}/orders/my-history`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    const data = await res.json();

    if (res.status === 401) {
      logout();
      return;
    }

    if (!data.success || data.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No past dining orders recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.data.map((o) => `
      <tr>
        <td class="fw-semibold"><code>#${o._id.slice(-6).toUpperCase()}</code></td>
        <td>${new Date(o.createdAt).toLocaleDateString()}</td>
        <td>${o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}</td>
        <td class="fw-bold">₹${o.totalAmount.toFixed(2)}</td>
        <td><span class="badge-status ${o.status.toLowerCase()}">${o.status}</span></td>
        <td>
          <button class="btn btn-sm btn-luxury-secondary" onclick="viewBill('${o._id}')">
            <i class="fa-regular fa-file-lines me-1"></i> View Receipt
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger text-center">Error loading order history.</td></tr>`;
  } finally {
    if (refreshButton) {
      refreshButton.disabled = false;
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
      const modalContent = document.getElementById('billModalContent');
      
      modalContent.innerHTML = `
        <div class="receipt-paper">
          <div class="receipt-header">
            <div class="brand-title" style="font-size: 1.15rem;">Gourmet Reserve</div>
            <div class="text-muted small">${b.branch?.name || 'Fine Dining Operations'}</div>
            <div class="text-muted small">${b.branch?.address || 'Bengaluru'}</div>
            <div class="mt-2 small"><strong>Receipt ID:</strong> #${b.orderId.slice(-8).toUpperCase()}</div>
            <div class="text-muted small"><strong>Date:</strong> ${new Date(b.createdAt).toLocaleString()}</div>
          </div>

          <div class="py-2 border-bottom border-top mb-3">
            ${b.items.map((i) => `
              <div class="receipt-line">
                <span>${i.quantity}x ${i.name}</span>
                <span class="fw-semibold">₹${i.subtotal.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>

          <div class="receipt-line text-muted">
            <span>Subtotal</span>
            <span>₹${b.subtotal.toFixed(2)}</span>
          </div>
          <div class="receipt-line text-muted">
            <span>GST Tax (5%)</span>
            <span>₹${b.taxAmount.toFixed(2)}</span>
          </div>
          <div class="receipt-line text-muted">
            <span>Service Charge (5%)</span>
            <span>₹${b.serviceCharge.toFixed(2)}</span>
          </div>
          <div class="receipt-line mt-3 pt-2 border-top fw-bold text-dark fs-6">
            <span>Total Paid</span>
            <span>₹${b.totalAmount.toFixed(2)}</span>
          </div>

          <div class="text-center text-muted small mt-4 pt-3 border-top">
            Thank you for dining at Gourmet Reserve.
          </div>
        </div>
      `;

      new bootstrap.Modal(document.getElementById('billModal')).show();
    }
  } catch (err) {
    showToast('Failed to load itemized bill', true);
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
      container.innerHTML = `<div class="alert alert-warning">Executive Administrator privilege required.</div>`;
      return;
    }

    const { revenueByBranch, popularDishes, peakHours } = data.data;
    const totalRev = revenueByBranch.reduce((acc, b) => acc + (b.totalRevenue || 0), 0);
    const totalOrdersCount = revenueByBranch.reduce((acc, b) => acc + (b.totalOrders || 0), 0);
    const avgCheck = totalOrdersCount > 0 ? (totalRev / totalOrdersCount).toFixed(2) : '0.00';

    container.innerHTML = `
      <!-- Top KPI Row -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="kpi-card">
            <div class="kpi-label">Gross Network Revenue</div>
            <div class="kpi-value">₹${totalRev.toLocaleString()}</div>
            <div class="kpi-helper">Consolidated across 18 branches</div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="kpi-card">
            <div class="kpi-label">Total Completed Orders</div>
            <div class="kpi-value">${totalOrdersCount}</div>
            <div class="kpi-helper">Dine-in and takeaway volume</div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="kpi-card">
            <div class="kpi-label">Average Check (AOV)</div>
            <div class="kpi-value">₹${avgCheck}</div>
            <div class="kpi-helper">Revenue per order check</div>
          </div>
        </div>
      </div>

      <!-- Detail Breakdowns -->
      <div class="row g-4">
        <!-- Revenue by Branch -->
        <div class="col-md-6">
          <div class="luxury-card">
            <div class="luxury-card-header">
              <h4 class="luxury-card-title" style="font-size: 1.05rem;">Revenue by Branch</h4>
            </div>
            <div class="luxury-card-body p-0">
              <table class="luxury-table">
                <thead>
                  <tr>
                    <th>Branch Location</th>
                    <th>Orders</th>
                    <th>Gross Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  ${revenueByBranch.length > 0 ? revenueByBranch.map((b) => `
                    <tr>
                      <td class="fw-semibold">${b.branchName}</td>
                      <td>${b.totalOrders}</td>
                      <td class="fw-bold">₹${b.totalRevenue.toLocaleString()}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="3" class="text-muted text-center py-3">No sales records yet.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Top Selling Dishes -->
        <div class="col-md-6">
          <div class="luxury-card">
            <div class="luxury-card-header">
              <h4 class="luxury-card-title" style="font-size: 1.05rem;">Top 5 Best-Selling Dishes</h4>
            </div>
            <div class="luxury-card-body p-0">
              <table class="luxury-table">
                <thead>
                  <tr>
                    <th>Dish Name</th>
                    <th>Volume Sold</th>
                    <th>Item Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  ${popularDishes.length > 0 ? popularDishes.map((d) => `
                    <tr>
                      <td class="fw-semibold">${d._id}</td>
                      <td>${d.totalQuantitySold} orders</td>
                      <td class="fw-bold">₹${d.totalItemRevenue.toLocaleString()}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="3" class="text-muted text-center py-3">No dish data recorded yet.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Error loading executive analytics. Switch role to Admin.</div>`;
  }
}

function showToast(message, isError = false) {
  const toastEl = document.getElementById('liveToast');
  const msgEl = document.getElementById('toastMessage');
  const iconEl = document.getElementById('toastIcon');
  if (!toastEl || !msgEl) return;

  msgEl.innerText = message;
  if (isError) {
    toastEl.style.borderLeftColor = '#EF4444';
    if (iconEl) {
      iconEl.className = 'fa-solid fa-circle-exclamation';
      iconEl.style.color = '#EF4444';
    }
  } else {
    toastEl.style.borderLeftColor = 'var(--color-accent-gold)';
    if (iconEl) {
      iconEl.className = 'fa-solid fa-circle-check';
      iconEl.style.color = 'var(--color-accent-gold)';
    }
  }

  toastEl.style.display = 'flex';
  toastEl.style.opacity = '1';

  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      toastEl.style.display = 'none';
    }, 300);
  }, 3000);
}
