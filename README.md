# Online Selling Platform

A multi-store online selling platform with:
- **Backend** – FastAPI + PostgreSQL
- **Web Admin** – Next.js 14 + Tailwind CSS
- **Mobile** – Flutter 3.x (iOS & Android)

---

## Project Structure

```
online-selling-platform/
├── backend/          FastAPI REST API
├── admin/            Next.js admin dashboard
├── mobile/           Flutter customer app
└── docker-compose.yml
```

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Flutter SDK (for mobile)
- Node.js 20+ (for admin, local dev)
- Python 3.12+ (for backend, local dev)

### 1. Start with Docker

```bash
# Copy env files
cp backend/.env.example backend/.env
cp admin/.env.local.example admin/.env.local

# Edit the env files with your credentials, then:
docker-compose up --build
```

- Backend API: http://localhost:8000
- Admin Panel: http://localhost:3000
- API Docs:    http://localhost:8000/docs

### 2. Seed the admin account

```bash
cd backend
pip install -r requirements.txt
SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=secret python seed.py
```

---

## Backend (FastAPI)

### Local Setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit DATABASE_URL etc.
uvicorn app.main:app --reload
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/stores | List active stores |
| GET | /api/v1/stores/{id} | Store detail |
| GET | /api/v1/stores/{id}/products | Store products |
| GET | /api/v1/products/{id} | Product detail |
| POST | /api/v1/orders | Place order |
| GET | /api/v1/orders/{id} | Order detail |
| POST | /api/v1/admin/login | Admin login |
| GET/POST | /api/v1/admin/stores | Manage stores |
| PUT/DELETE | /api/v1/admin/stores/{id} | Edit/delete store |
| POST | /api/v1/admin/stores/{id}/products | Add product |
| PUT/DELETE | /api/v1/admin/products/{id} | Edit/delete product |
| GET | /api/v1/admin/orders | List orders |
| PUT | /api/v1/admin/orders/{id}/status | Update status |
| GET/PUT | /api/v1/admin/settings/{store_id} | Store settings |

---

## Admin Panel (Next.js)

### Local Setup

```bash
cd admin
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev
```

Open http://localhost:3000 → redirects to `/dashboard`.  
Login at `/login` with your seeded admin credentials.

### Pages
- `/login` – Admin authentication
- `/dashboard` – Stats overview + recent orders
- `/dashboard/stores` – Create/edit/delete stores
- `/dashboard/products` – Manage products per store
- `/dashboard/orders` – View & update order status
- `/dashboard/settings` – SMTP & delivery settings per store

---

## Mobile App (Flutter)

### Local Setup

```bash
cd mobile
flutter pub get
```

Edit `lib/constants.dart` to set the correct API URL:
- Android emulator: `http://10.0.2.2:8000/api/v1`
- iOS simulator: `http://localhost:8000/api/v1`
- Physical device: `http://<your-machine-ip>:8000/api/v1`

```bash
flutter run
```

### Screens
- **Home** – Grid of all stores with search
- **Store** – Product grid/list with category filter
- **Product Detail** – Image gallery, specs, add to cart / buy now
- **Cart** – Manage items, view summary
- **Checkout** – Customer form + order placement
- **Order Success** – Confirmation with order number

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret |
| `SMTP_HOST/PORT/USERNAME/PASSWORD` | Email credentials |
| `FROM_EMAIL` | Sender email address |
| `AWS_*` | S3 credentials for image storage |

### Admin (`admin/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

---

## Security Notes

- JWT tokens expire after 24 hours
- Passwords are hashed with bcrypt
- SMTP password is stored in DB (consider encrypting at rest in production)
- Always use HTTPS in production
- Set strong `SECRET_KEY` and rotate regularly
