# 📱 Online Selling Platform - Project Specification

## 🎯 Project Overview

A simple, multi-store online selling platform where:
- Main app acts as a container for multiple sub-apps (stores)
- Each sub-app represents an independent online store
- Users can browse products, add to cart, and place orders
- Admin receives email notifications for each order
- No payment gateway integration (form-based orders only)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Flutter)                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │          Home Screen (Store List)                   │ │
│  └────────────────────────────────────────────────────┘ │
│                          │                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Sub-App (Store View)                              │ │
│  │  ├─ Products Grid/List                             │ │
│  │  ├─ Product Details                                │ │
│  │  ├─ Shopping Cart                                  │ │
│  │  └─ Checkout Form                                  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                    REST API (HTTPS)
                          │
┌─────────────────────────────────────────────────────────┐
│              Backend Server (FastAPI/Node.js)            │
│  ┌────────────────────────────────────────────────────┐ │
│  │  API Endpoints                                      │ │
│  │  ├─ GET /stores                                     │ │
│  │  ├─ GET /stores/{id}/products                      │ │
│  │  ├─ POST /orders                                    │ │
│  │  ├─ POST /admin/stores (Admin)                     │ │
│  │  └─ POST /admin/products (Admin)                   │ │
│  └────────────────────────────────────────────────────┘ │
│                          │                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Email Service (SMTP/SendGrid)                     │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│              Database (PostgreSQL/MongoDB)               │
│  ├─ Stores Collection                                   │
│  ├─ Products Collection                                 │
│  ├─ Orders Collection                                   │
│  └─ Admin Settings Collection                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Feature Breakdown

### 1️⃣ Main App (Container)

**Home Screen:**
- Display grid/list of all sub-apps (stores)
- Each store card shows:
  - Store logo/icon
  - Store name
  - Short description
  - Number of products
  - "Browse" button
- Search bar to filter stores
- Pull-to-refresh functionality

**Navigation:**
- Bottom navigation: Home | Orders | Profile
- App drawer with settings and about

---

### 2️⃣ Sub-App (Individual Store)

#### 🛍️ Product Catalog Screen
- Grid or list view toggle
- Filter by category
- Sort options (price, name, newest)
- Search products within store

**Product Card:**
```
┌─────────────────────┐
│   Product Image     │
│                     │
├─────────────────────┤
│ Product Name        │
│ ₹999                │
│ Short description   │
│ [Add to Cart]       │
└─────────────────────┘
```

#### 📦 Product Detail Screen
- Full-size image gallery (swipeable)
- Product name
- Price
- Full description
- Specifications (optional)
- Stock status
- Quantity selector
- Add to Cart / Buy Now buttons
- Back button

#### 🛒 Shopping Cart Screen
- List of added items
- Each item shows:
  - Thumbnail image
  - Product name
  - Price per unit
  - Quantity controls (+/-)
  - Remove button
  - Subtotal
- Cart summary:
  - Subtotal
  - Delivery charges (if any)
  - Total amount
- "Continue Shopping" button
- "Proceed to Checkout" button
- Empty cart state with illustration

#### 📝 Checkout Screen
**Customer Information Form:**
```
Full Name*          [________________]
Phone Number*       [________________]
Email Address*      [________________]
Delivery Address*   [________________]
                    [________________]
City*               [________________]
Pincode*            [________________]
Notes (Optional)    [________________]
                    [________________]

Order Summary:
├─ Item 1: ₹500 × 2 = ₹1000
├─ Item 2: ₹300 × 1 = ₹300
├─ Subtotal: ₹1300
├─ Delivery: ₹50
└─ Total: ₹1350

[ Place Order ]
```

**Order Confirmation:**
- Success animation/icon
- Order ID
- "Your order has been successfully placed!"
- Order summary
- "Back to Home" / "Track Order" buttons

---

### 3️⃣ Admin Features

#### 🏪 Store Management
- Create new store
  - Store name
  - Description
  - Logo/icon upload
  - Admin email for notifications
  - Enable/disable store
- Edit store details
- Delete store
- View store statistics

#### 📦 Product Management
- Add new product
  - Product name
  - Description
  - Price
  - Category
  - Stock quantity
  - Multiple image upload
  - Specifications (key-value pairs)
- Edit product details
- Delete product
- Bulk import/export (CSV)

#### 📧 Order Management
- View all orders
- Filter by status: Pending | Confirmed | Delivered | Cancelled
- Order details view
- Update order status
- Email notifications settings

#### ⚙️ Settings
- Admin email configuration
- SMTP settings
- Delivery charge settings
- Tax settings (optional)
- Currency settings
- App theme/branding

---

## 🗄️ Database Schema

### Option 1: PostgreSQL (Relational)

```sql
-- Stores Table
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    admin_email VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    category VARCHAR(100),
    images JSONB, -- Array of image URLs
    specifications JSONB, -- Key-value pairs
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    store_id UUID REFERENCES stores(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    delivery_address TEXT NOT NULL,
    city VARCHAR(100),
    pincode VARCHAR(10),
    notes TEXT,
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_charges DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, delivered, cancelled
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

-- Admin Settings Table
CREATE TABLE admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) UNIQUE,
    smtp_host VARCHAR(255),
    smtp_port INTEGER,
    smtp_username VARCHAR(255),
    smtp_password VARCHAR(255), -- Encrypted
    default_delivery_charge DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### Option 2: MongoDB (NoSQL)

```javascript
// stores collection
{
  _id: ObjectId,
  name: String,
  description: String,
  logoUrl: String,
  adminEmail: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// products collection
{
  _id: ObjectId,
  storeId: ObjectId,
  name: String,
  description: String,
  price: Number,
  stockQuantity: Number,
  category: String,
  images: [String],
  specifications: {
    key1: value1,
    key2: value2
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// orders collection
{
  _id: ObjectId,
  orderNumber: String,
  storeId: ObjectId,
  customer: {
    name: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    pincode: String
  },
  items: [
    {
      productId: ObjectId,
      productName: String,
      productPrice: Number,
      quantity: Number,
      subtotal: Number
    }
  ],
  notes: String,
  subtotal: Number,
  deliveryCharges: Number,
  totalAmount: Number,
  status: String,
  createdAt: Date,
  updatedAt: Date
}

// adminSettings collection
{
  _id: ObjectId,
  storeId: ObjectId,
  smtp: {
    host: String,
    port: Number,
    username: String,
    password: String // Encrypted
  },
  defaultDeliveryCharge: Number,
  currency: String,
  updatedAt: Date
}
```

### Option 3: Firebase Firestore

```
stores/
  {storeId}/
    name: string
    description: string
    logoUrl: string
    adminEmail: string
    isActive: boolean
    createdAt: timestamp
    updatedAt: timestamp
    
    products/
      {productId}/
        name: string
        description: string
        price: number
        stockQuantity: number
        category: string
        images: array
        specifications: map
        isActive: boolean
        createdAt: timestamp
    
    orders/
      {orderId}/
        orderNumber: string
        customer: map
        items: array
        notes: string
        subtotal: number
        deliveryCharges: number
        totalAmount: number
        status: string
        createdAt: timestamp
    
    settings/
      smtp: map
      defaultDeliveryCharge: number
      currency: string
```

---

## 🔌 API Structure

### Public Endpoints (Mobile App)

```
GET    /api/v1/stores
GET    /api/v1/stores/{store_id}
GET    /api/v1/stores/{store_id}/products
GET    /api/v1/products/{product_id}
POST   /api/v1/orders
GET    /api/v1/orders/{order_id}
```

### Admin Endpoints (Protected)

```
POST   /api/v1/admin/login
POST   /api/v1/admin/stores
PUT    /api/v1/admin/stores/{store_id}
DELETE /api/v1/admin/stores/{store_id}
POST   /api/v1/admin/stores/{store_id}/products
PUT    /api/v1/admin/products/{product_id}
DELETE /api/v1/admin/products/{product_id}
GET    /api/v1/admin/orders
PUT    /api/v1/admin/orders/{order_id}/status
GET    /api/v1/admin/settings
PUT    /api/v1/admin/settings
```

### Example Request/Response

**POST /api/v1/orders**
```json
// Request
{
  "storeId": "uuid-or-id",
  "customer": {
    "name": "Akshar Patel",
    "phone": "+919876543210",
    "email": "akshar@example.com",
    "address": "123 MG Road, Apartment 5B",
    "city": "Mumbai",
    "pincode": "400001"
  },
  "items": [
    {
      "productId": "prod-123",
      "productName": "Product 1",
      "price": 500,
      "quantity": 2
    }
  ],
  "notes": "Please deliver after 6 PM",
  "subtotal": 1000,
  "deliveryCharges": 50,
  "totalAmount": 1050
}

// Response
{
  "success": true,
  "orderId": "ord-456",
  "orderNumber": "ORD-2026-0001",
  "message": "Your order has been successfully placed!",
  "estimatedDelivery": "2-3 business days"
}
```

---

## 📧 Email Notification Template

```
Subject: New Order #ORD-2026-0001

Hi Admin,

You have received a new order!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order Number: ORD-2026-0001
Order Date: March 3, 2026, 10:30 AM
Store: Store Name

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CUSTOMER INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: Akshar Patel
Phone: +919876543210
Email: akshar@example.com
Address: 123 MG Road, Apartment 5B
City: Mumbai
Pincode: 400001

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Product 1
   Quantity: 2
   Price: ₹500 × 2 = ₹1000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal: ₹1000
Delivery Charges: ₹50
Total Amount: ₹1050

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please deliver after 6 PM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please log in to your admin panel to confirm this order.

Best regards,
Online Selling Platform
```

---

## 🎨 UI/UX Considerations

### Design Principles
- **Clean & Minimal**: Focus on products, not clutter
- **Mobile-First**: Optimized for thumb-friendly navigation
- **Fast Loading**: Lazy load images, cache data
- **Accessibility**: High contrast, readable fonts, screen reader support

### Color Scheme Options
1. **E-commerce Classic**: Blue (#2563EB) + Orange (#F59E0B)
2. **Modern Minimal**: Black (#1F2937) + White (#FFFFFF) + Accent (#10B981)
3. **Friendly Pastel**: Purple (#8B5CF6) + Pink (#EC4899)

### Typography
- **Headings**: Inter Bold / Poppins Bold
- **Body**: Inter Regular / Roboto Regular
- **Price**: Inter SemiBold (Emphasized)

### Components
- Material Design 3 / Cupertino (iOS style)
- Bottom sheets for filters/actions
- Snackbars for notifications
- Skeleton loaders for loading states
- Empty state illustrations

---

## 🛠️ Tech Stack Options

### Option 1: Full Stack Flutter + FastAPI (Recommended)

**Mobile App:**
- **Framework**: Flutter 3.x
- **State Management**: Provider / Riverpod / Bloc
- **HTTP Client**: Dio
- **Local Storage**: SharedPreferences / Hive
- **Image Handling**: cached_network_image
- **Forms**: flutter_form_builder

**Backend:**
- **Framework**: Python FastAPI
- **Database**: PostgreSQL + SQLAlchemy ORM
- **Authentication**: JWT tokens
- **Email**: python-smtplib / SendGrid
- **File Upload**: AWS S3 / Cloudinary
- **Deployment**: Docker + Railway/Render

**Pros:**
- Consistent with your existing stack (Jain Assistant)
- Fast development
- Type-safe APIs (Pydantic models)
- Great performance

---

### Option 2: Flutter + Firebase (Easiest)

**Mobile App:**
- Flutter 3.x
- **State Management**: Provider
- **Backend**: Firebase (No custom backend needed!)
  - Firestore Database
  - Firebase Authentication
  - Firebase Cloud Functions (for emails)
  - Firebase Storage (images)

**Pros:**
- Fastest to build
- No backend coding needed
- Real-time updates
- Built-in authentication
- Auto-scaling

**Cons:**
- Vendor lock-in
- Limited complex queries
- Cost increases with usage

---

### Option 3: Flutter + Node.js

**Mobile App:**
- Flutter 3.x

**Backend:**
- **Framework**: Node.js + Express / NestJS
- **Database**: MongoDB + Mongoose
- **Email**: Nodemailer
- **File Upload**: Multer + AWS S3

**Pros:**
- JavaScript everywhere
- Large ecosystem
- Fast for CRUD operations

---

## 📅 Development Roadmap

### Phase 1: MVP (2-3 weeks)
- [ ] Database setup
- [ ] Backend API (stores, products, orders)
- [ ] Mobile app UI (home, products, cart)
- [ ] Checkout flow
- [ ] Email notifications
- [ ] Basic testing

### Phase 2: Admin Panel (1-2 weeks)
- [ ] Admin authentication
- [ ] Store management CRUD
- [ ] Product management CRUD
- [ ] Order management dashboard
- [ ] Settings page

### Phase 3: Enhancement (1-2 weeks)
- [ ] Image optimization
- [ ] Search & filters
- [ ] Order tracking
- [ ] Push notifications
- [ ] Analytics dashboard
- [ ] Bulk operations

### Phase 4: Polish & Deploy (1 week)
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Security audit
- [ ] Play Store / App Store deployment
- [ ] Documentation

---

## 🔒 Security Considerations

1. **API Security**
   - JWT authentication for admin
   - Rate limiting
   - Input validation (Pydantic/Joi)
   - SQL injection prevention (ORM)

2. **Data Protection**
   - HTTPS only
   - Password hashing (bcrypt)
   - Environment variables for secrets
   - CORS configuration

3. **Payment Safety**
   - No credit card storage
   - PCI compliance not needed (no payment processing)

4. **Email Security**
   - SMTP credentials encrypted
   - Email rate limiting
   - Spam prevention

---

## 💰 Estimated Costs (Monthly)

### Option 1: FastAPI + PostgreSQL
- **Hosting**: $5-10 (Railway/Render)
- **Database**: $0-5 (Railway free tier or Supabase)
- **Email**: $0-15 (SendGrid free tier or SMTP)
- **Images**: $1-5 (AWS S3)
- **Total**: ~$10-35/month

### Option 2: Firebase
- **Free Tier**: Up to 50K reads/day, 20K writes/day
- **Paid (Blaze)**: Pay-as-you-go
- **Estimate**: $10-50/month for small business
- **Email**: Cloud Functions ($0.40/million invocations)

---

## 📦 Deliverables

1. **Mobile App (Flutter)**
   - iOS & Android apps
   - Source code
   - Build instructions

2. **Backend API**
   - REST API with documentation
   - Database migrations
   - Deployment config

3. **Documentation**
   - User guide
   - Admin guide
   - API documentation
   - Setup instructions

4. **Testing**
   - Unit tests
   - Integration tests
   - Manual test cases

---

## 🚀 Next Steps

1. **Choose Tech Stack** (Decision needed!)
   - [ ] Option 1: Flutter + FastAPI + PostgreSQL
   - [ ] Option 2: Flutter + Firebase
   - [ ] Option 3: Flutter + Node.js

2. **Finalize Requirements**
   - Any additional features?
   - Specific design preferences?
   - Target launch date?

3. **Setup Development Environment**
   - Create project structure
   - Setup version control
   - Configure CI/CD

4. **Start Development!** 🎉

---

## 📞 Contact & Questions

Before we proceed, please confirm:

1. ✅ Tech stack preference?
2. ✅ Admin panel: Mobile or Web?
3. ✅ Timeline expectations?
4. ✅ Budget constraints?
5. ✅ Any specific integrations needed?

---

**Ready to build when you are!** 🚀

---

---

# 🏢 Enhanced Multi-Store Ownership & Customer Workflow

## 🎯 Updated Business Model

This platform is not just a marketplace.

It is a **multi-store selling platform** where:
- The **platform owner (Super Admin)** manages the entire application
- External **business owners/customers** can request their own store
- The **Super Admin manually creates stores** for them
- Once created, the **store owner receives access** to manage their own store
- **End users** can browse all stores and place orders
- Store owners **receive order details by email** and directly coordinate payment and delivery with buyers

---

## 👥 User Roles

### 1️⃣ Super Admin (Platform Owner)

The Super Admin controls the entire platform.

**Responsibilities:**
- Receive store requests via email/contact
- Create and approve stores manually
- Create login credentials for store owners
- Manage all stores on the platform
- Enable/disable stores
- Monitor all orders
- Manage platform-wide settings

**Super Admin Permissions:**
- Full CRUD on stores
- Full CRUD on products
- View all orders
- Manage all users
- Suspend stores
- Reset store owner passwords
- Configure SMTP/email settings

### 2️⃣ Store Owner (Customer)

A Store Owner is a business/customer who requests a store from the platform admin.

**Store Request Flow:**
1. Business owner contacts platform admin via email/contact form
2. Super Admin creates the store manually
3. Store Owner receives:
   - Store access credentials
   - Admin login URL
   - Store details
4. Store Owner logs in and manages their store independently

**Store Owner Features — After login, Store Owners can:**

**Store Management:**
- Edit store details
- Upload store logo/banner
- Add store description
- Configure contact information
- Enable/disable products

**Product Management:**
- Add products with multiple images
- Add categories
- Update pricing
- Manage stock quantity
- Add specifications
- Delete/edit products

**Order Management:**
- View incoming orders
- Update order status
- Contact customer directly
- Manage delivery coordination
- Handle payment manually outside the app

---

## 🛒 End User Flow

Any user downloading the mobile app can:

1. **Browse Stores** — View all active stores, search, open store pages, browse products
2. **Shop Products** — Add items to cart, checkout without payment gateway, submit delivery/contact information

**Once order is placed:**
- Order is stored in database
- Email notification is sent to Store Owner
- Store Owner receives: customer details, ordered products, delivery address, contact number, notes

**The Store Owner then:**
- Contacts customer directly
- Confirms payment method
- Arranges delivery/shipping manually

---

## 📧 Updated Order Processing Logic

> This platform **intentionally avoids** integrated payment gateways.

```
Customer Places Order
        ↓
Platform Stores Order
        ↓
Email Sent To Store Owner
        ↓
Store Owner Contacts Customer
        ↓
Payment Finalized Offline
        ↓
Order Shipped/Delivered
```

**Email Notification — Must Include:**
- Order Number
- Customer Name, Phone, Email, Delivery Address
- Ordered Products & Quantity
- Total Amount
- Customer Notes

**Send Email To:**
- Store Owner Email
- Optional: Super Admin Notification

---

## 🔐 Authentication Structure

| Role | Access |
|---|---|
| `super_admin` | Entire platform |
| `store_owner` | Only own store |

---

## 🗄️ Updated Database Design

### Users Table (New)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL, -- super_admin, store_owner
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Stores Table Updates
```sql
ALTER TABLE stores ADD COLUMN owner_id UUID REFERENCES users(id);
ALTER TABLE stores ADD COLUMN contact_phone VARCHAR(20);
ALTER TABLE stores ADD COLUMN address TEXT;
```

---

## 🧩 Multi-Tenant Store Isolation

Each Store Owner must only access **their own** products, orders, settings, and customers.

All APIs must validate: `store.owner_id == logged_in_user.id`

---

## 📊 Updated API Structure

### Public APIs
```
GET  /api/v1/stores
GET  /api/v1/stores/{id}
GET  /api/v1/stores/{id}/products
POST /api/v1/orders
```

### Store Owner APIs
```
POST   /api/v1/store-owner/login
GET    /api/v1/store-owner/orders
POST   /api/v1/store-owner/products
PUT    /api/v1/store-owner/products/{id}
DELETE /api/v1/store-owner/products/{id}
PUT    /api/v1/store-owner/orders/{id}/status
```

### Super Admin APIs
```
POST   /api/v1/admin/login
POST   /api/v1/admin/stores
GET    /api/v1/admin/stores
PUT    /api/v1/admin/stores/{id}
DELETE /api/v1/admin/stores/{id}
```

---

## ✅ Final Recommended Architecture

| Component | Technology |
|---|---|
| Mobile App | Flutter |
| Backend API | FastAPI |
| Database | PostgreSQL |
| Admin Dashboard | Next.js |
| Authentication | JWT |
| Image Storage | Cloudinary |
| Email Service | SMTP / SendGrid |
| Deployment | Docker |

---

## 🎯 Final Platform Workflow

```
Store Owner Requests Store
          ↓
Super Admin Creates Store
          ↓
Store Owner Receives Login Credentials
          ↓
Store Owner Adds Products & Categories
          ↓
Users Browse Stores In Mobile App
          ↓
Users Place Orders
          ↓
Store Owner Receives Order Email
          ↓
Store Owner Contacts Customer
          ↓
Payment & Delivery Handled Offline
```

---

## 🔥 Future Enhancements

- WhatsApp notification integration
- Store custom domains
- Subscription plans for store owners
- Analytics dashboard
- Push notifications
- Coupon system
- Delivery tracking
- Razorpay/Stripe integration (optional)


Rebuild with docker-compose up --build then re-run docker-compose exec backend python seed.py.

Email: admin@example.com
Password: changeme123

Super Admin :  admin@example.com   / changeme123

Store Owner 1: fashion@demo.com    / demo1234
Store Owner 2: electronics@demo.com / demo1234

Customer 1  :  akshar@demo.com      / customer123
Customer 2  :  neha@demo.com        / customer123
Customer 3  :  ravi@demo.com        / customer123


