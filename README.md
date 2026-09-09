# Restaurant Table Reservation & Food Ordering System

**5th Semester • Christ University • CIA-3 Project Development**  
*L&T EduTech Confidential – Academic Use Only*

---

## 1. Project Title & Team Details

- **Project Title**: Restaurant Table Reservation & Food Ordering System
- **Domain**: Food & Beverage
- **Institution**: Christ University (Department of Computer Science & Applications)
- **Course**: 5th Semester CIA-3 Backend Development & Database Design

---

## 2. Problem Statement

Modern restaurant chains require an end-to-end digital backend system that enables customers to reserve dining tables without slot collisions and order food online, while enabling kitchen staff to track pending order queues in real time, and empowering restaurant managers to analyze revenue, top-selling dishes, and peak operational hours across multiple branches.

---

## 3. Tech Stack Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) with bcryptjs password hashing
- **Validation**: Joi Schema Validation Middleware
- **Error Handling**: Centralized Express Error Middleware returning consistent JSON schema
- **Frontend (Optional/Recommended)**: HTML5, CSS3 (Bootstrap 5 + Custom Glassmorphic Styling), JavaScript (Fetch API)
- **API Testing**: Postman Collection (`postman/Restaurant_System_CIA3.postman_collection.json`)

---

## 4. Setup & Local Installation Instructions

### Prerequisites
- Node.js (v16+ installed)
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or MongoDB Atlas URI)

### Installation Steps

1. **Clone & Navigate**:
   ```bash
   cd /Users/hemishgogineni/Documents/restaurant-table-reservation-system
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file (copied from `.env.example`):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/restaurant_reservation_db
   JWT_SECRET=super_secret_jwt_key_christ_university_cia3_2026
   TAX_RATE=0.05
   SERVICE_CHARGE_RATE=0.05
   ```

4. **Seed Demo Data (Instant Demo Ready)**:
   ```bash
   npm run seed
   ```
   *Creates initial Branch, Users (Customer, Kitchen, Admin), Tables, Menu Items, Sample Order & Reservation.*

5. **Start Local Server**:
   ```bash
   npm run dev   # or npm start
   ```

6. **Access Interactive Web Dashboard**:
   Open browser at: [http://localhost:5050](http://localhost:5050)

---

## 5. List of 13 Implemented Modules

| # | Module Name | Implementation Status | Features Covered |
|---|---|---|---|
| 1 | **Customer Registration & Auth** | Completed | JWT authentication, bcrypt password hashing, role separation (`customer`, `kitchen`, `admin`). |
| 2 | **Menu Management** | Completed | CRUD for branch menu items with categories, prices, descriptions, availability toggles, **and Dietary Preference filtering (Bonus)**. |
| 3 | **Table Inventory Management** | Completed | Branch-wise table seating capacity definition and availability management. |
| 4 | **Table Reservation Engine** | Completed | Slot-based booking system with **conflict validation preventing double-booking**. |
| 5 | **Food Order Placement** | Completed | Dine-in and Takeaway food ordering with menu price snapshotting and item availability check. |
| 6 | **Order Status Workflow** | Completed | Enforced workflow: `Placed` → `Preparing` → `Ready` → `Served/Delivered`. |
| 7 | **Kitchen Display Queue APIs** | Completed | Kitchen queue displaying active pending orders sorted by order time ASC. |
| 8 | **Billing & Order Summary** | Completed | Itemized bill calculations: `subtotal + 5% GST tax + 5% service charge = totalAmount`. |
| 9 | **Reservation Cancellation Policy** | Completed | Business rule check enforcing minimum 1-hour prior cancellation constraint. |
| 10 | **Customer Order History** | Completed | Customer dashboard viewing past food orders and table reservation records. |
| 11 | **Feedback & Rating Module** | Completed | Post-meal order rating (1-5 stars) & reviews; branch average rating calculation. |
| 12 | **Branch Management** | Completed | Admin management of restaurant locations, address, seating limits, and contact info. |
| 13 | **Manager Reports & Analytics** | Completed | MongoDB aggregation pipeline for revenue-by-branch, top-selling dishes, and peak hours. |

---

## 6. API Endpoint Reference

### Auth Routes (`/api/auth`)
- `POST /api/auth/register` - Register customer / staff user
- `POST /api/auth/login` - Authenticate user & issue JWT
- `GET /api/auth/me` - Fetch active user profile

### Menu Routes (`/api/menu`)
- `GET /api/menu` - Browse menu items (filter by `branchId`, `category`, `availableOnly`)
- `POST /api/menu` - (Admin) Create menu item
- `PUT /api/menu/:id` - (Admin) Update menu item
- `DELETE /api/menu/:id` - (Admin) Delete menu item

### Table Routes (`/api/tables`)
- `GET /api/tables` - Fetch branch tables
- `POST /api/tables` - (Admin) Add new table
- `PUT /api/tables/:id` - (Admin) Update table details

### Reservation Routes (`/api/reservations`)
- `GET /api/reservations/available-tables` - Query available unreserved tables for time slot
- `POST /api/reservations` - Reserve table slot (Enforces double-booking prevention)
- `GET /api/reservations` - View reservations
- `PUT /api/reservations/:id/cancel` - Cancel reservation (Enforces 1-hr cancellation rule)

### Food Order & Kitchen Routes (`/api/orders`, `/api/kitchen`)
- `POST /api/orders` - Place food order (Auto computes subtotal, GST, service charge)
- `GET /api/orders/:id/bill` - Detailed itemized bill summary
- `GET /api/orders/my-history` - Customer order history
- `GET /api/kitchen/queue` - (Kitchen Staff) Pending orders sorted by time ASC
- `PUT /api/orders/:id/status` - (Kitchen/Admin) Transition order workflow status

### Feedback & Manager Analytics Routes (`/api/feedback`, `/api/manager/reports`)
- `POST /api/feedback` - Submit order rating & comments
- `GET /api/feedback/branch/:branchId` - Branch feedback summary & average rating
- `GET /api/manager/reports/analytics` - (Admin) Revenue by branch, top dishes, peak hours aggregation

---

## 7. MongoDB Database Schema & Design Rationale

### Collections & Indexing Strategy

1. **`users`**: `{ email: 1 }` (Unique index for fast authentication lookups).
2. **`branches`**: `{ name: 1 }` (Index for status and name search).
3. **`tables`**: `{ branchId: 1 }` (Index for branch seating lookups).
4. **`menuItems`**: `{ branchId: 1 }` (Index for category/branch menu filtering).
5. **`reservations`**: `{ customerId: 1 }`, `{ branchId: 1, dateTime: 1 }` (Index for slot collision checks).
6. **`orders`**: `{ customerId: 1 }`, `{ branchId: 1, status: 1 }` (Index for customer history & kitchen queue).
7. **`feedback`**: `{ orderId: 1 }`, `{ branchId: 1 }`.

### Reference vs Embedding Rationale
- **Embedded `items[]` inside `Order`**: Order items are embedded directly because an order's items are always read together with the parent order and snapshot prices at placement time.
- **Referenced `branchId`, `customerId`, `tableId`**: Stored as ObjectIds (`ref`) because users, branches, and tables exist independently and are shared across multiple orders and reservations.

---

## 8. Sample Request & Response Examples

### POST `/api/reservations` (Reserve Table)
**Request Body**:
```json
{
  "branchId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "tableId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "dateTime": "2026-09-04T19:00:00.000Z",
  "guestsCount": 4
}
```
**Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Table reserved successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
    "status": "confirmed"
  }
}
```

### Business Rule Conflict Error (409 Conflict)
```json
{
  "success": false,
  "message": "Table double-booking conflict! The selected table is already reserved for this time slot.",
  "errorCode": "TABLE_SLOT_CONFLICT"
}
```

---

## 9. Deliverables Checklist

- [x] Complete Node.js + Express + MongoDB Source Code in `/Users/hemishgogineni/Documents/restaurant-table-reservation-system`
- [x] Comprehensive `README.md` with setup guidelines & API specification
- [x] Postman Collection Export (`postman/Restaurant_System_CIA3.postman_collection.json`)
- [x] Seed script (`npm run seed`) for instant evaluation setup
- [x] Interactive Bootstrap Frontend Dashboard (`public/index.html`)

---
