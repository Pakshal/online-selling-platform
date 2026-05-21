"""
Seed script — creates super admin + 2 demo store owners + stores + products.
Run once after DB setup:
  python seed.py
"""
import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from app.database import SessionLocal, engine
from app import models
from app.auth import hash_password

# Run column migrations before any queries
_MIGRATIONS = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES users(id) ON DELETE SET NULL",
]
with engine.begin() as _conn:
    for _sql in _MIGRATIONS:
        _conn.execute(text(_sql))
print("✓ Migrations applied")

db = SessionLocal()

# ─── Super Admin ──────────────────────────────────────────────────────────────
ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "changeme123")

if not db.query(models.User).filter(models.User.email == ADMIN_EMAIL).first():
    admin = models.User(
        full_name="Super Admin",
        email=ADMIN_EMAIL,
        hashed_password=hash_password(ADMIN_PASSWORD),
        role="super_admin",
    )
    db.add(admin)
    db.commit()
    print(f"✓ Super admin created: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
else:
    print(f"  Super admin already exists, skipping.")

# ─── Demo Store Owner 1: Fashion Store ────────────────────────────────────────
owner1_email = "fashion@demo.com"
if not db.query(models.User).filter(models.User.email == owner1_email).first():
    owner1 = models.User(
        full_name="Priya Sharma",
        email=owner1_email,
        hashed_password=hash_password("demo1234"),
        role="store_owner",
    )
    db.add(owner1)
    db.flush()

    store1 = models.Store(
        owner_id=owner1.id,
        name="Priya's Fashion Hub",
        description="Trendy ethnic and western wear for all occasions",
        logo_url="https://via.placeholder.com/150?text=Fashion",
        admin_email=owner1_email,
        contact_phone="+91-9876543210",
        address="12 MG Road, Bengaluru, Karnataka 560001",
        is_active=True,
    )
    db.add(store1)
    db.flush()

    db.add(models.Product(
        store_id=store1.id, name="Anarkali Suit - Blue", category="Ethnic Wear",
        price=1299.00, stock_quantity=50,
        description="Beautiful blue anarkali with embroidery work",
        images=["https://via.placeholder.com/400x500?text=Anarkali+Blue"],
    ))
    db.add(models.Product(
        store_id=store1.id, name="Kurti Set - Pink Floral", category="Ethnic Wear",
        price=849.00, stock_quantity=30,
        description="Comfortable daily wear kurti with matching palazzo",
        images=["https://via.placeholder.com/400x500?text=Kurti+Pink"],
    ))
    db.add(models.Product(
        store_id=store1.id, name="Denim Jacket - Black", category="Western Wear",
        price=1599.00, stock_quantity=20,
        description="Classic black denim jacket, unisex fit",
        images=["https://via.placeholder.com/400x500?text=Denim+Jacket"],
    ))
    db.add(models.AdminSettings(
        store_id=store1.id, default_delivery_charge=49.00, currency="INR"
    ))
    db.commit()
    print(f"✓ Store owner 1 created: {owner1_email} / demo1234")
    print(f"  Store: Priya's Fashion Hub (3 products)")
else:
    print(f"  Store owner 1 already exists, skipping.")

# ─── Demo Store Owner 2: Electronics Store ────────────────────────────────────
owner2_email = "electronics@demo.com"
if not db.query(models.User).filter(models.User.email == owner2_email).first():
    owner2 = models.User(
        full_name="Rahul Mehta",
        email=owner2_email,
        hashed_password=hash_password("demo1234"),
        role="store_owner",
    )
    db.add(owner2)
    db.flush()

    store2 = models.Store(
        owner_id=owner2.id,
        name="Rahul's Tech Bazaar",
        description="Latest gadgets, accessories and electronics at best prices",
        logo_url="https://via.placeholder.com/150?text=Tech",
        admin_email=owner2_email,
        contact_phone="+91-9123456789",
        address="45 Nehru Nagar, Mumbai, Maharashtra 400001",
        is_active=True,
    )
    db.add(store2)
    db.flush()

    db.add(models.Product(
        store_id=store2.id, name="Wireless Earbuds Pro", category="Audio",
        price=2499.00, stock_quantity=100,
        description="True wireless earbuds with 30hr battery and ANC",
        images=["https://via.placeholder.com/400x500?text=Earbuds"],
    ))
    db.add(models.Product(
        store_id=store2.id, name="USB-C Fast Charger 65W", category="Accessories",
        price=799.00, stock_quantity=200,
        description="GaN 65W fast charger, compatible with laptops and phones",
        images=["https://via.placeholder.com/400x500?text=Charger"],
    ))
    db.add(models.Product(
        store_id=store2.id, name="Mechanical Keyboard TKL", category="Computer Peripherals",
        price=3999.00, stock_quantity=15,
        description="Tenkeyless mechanical keyboard with blue switches and RGB",
        images=["https://via.placeholder.com/400x500?text=Keyboard"],
    ))
    db.add(models.Product(
        store_id=store2.id, name="Laptop Stand Aluminium", category="Accessories",
        price=1199.00, stock_quantity=40,
        description="Adjustable aluminium laptop stand for 11-17 inch laptops",
        images=["https://via.placeholder.com/400x500?text=Laptop+Stand"],
    ))
    db.add(models.AdminSettings(
        store_id=store2.id, default_delivery_charge=99.00, currency="INR"
    ))
    db.commit()
    print(f"✓ Store owner 2 created: {owner2_email} / demo1234")
    print(f"  Store: Rahul's Tech Bazaar (4 products)")
else:
    print(f"  Store owner 2 already exists, skipping.")

# ─── Demo Customers (can log in & browse stores) ──────────────────────────────
demo_customers = [
    ("Akshar Patel",   "akshar@demo.com",  "customer123"),
    ("Neha Gupta",     "neha@demo.com",    "customer123"),
    ("Ravi Kumar",     "ravi@demo.com",    "customer123"),
]
for full_name, email, password in demo_customers:
    if not db.query(models.User).filter(models.User.email == email).first():
        db.add(models.User(
            full_name=full_name,
            email=email,
            hashed_password=hash_password(password),
            role="customer",
        ))
        print(f"✓ Customer created: {email} / {password}")
    else:
        print(f"  Customer {email} already exists, skipping.")
db.commit()

db.close()
print("\n── Login Credentials ──────────────────────────────────")
print("Super Admin :  admin@example.com    / changeme123")
print("Store Owner 1: fashion@demo.com     / demo1234")
print("Store Owner 2: electronics@demo.com / demo1234")
print("Customer 1  :  akshar@demo.com      / customer123")
print("Customer 2  :  neha@demo.com        / customer123")
print("Customer 3  :  ravi@demo.com        / customer123")
print("───────────────────────────────────────────────────────")
print("Customer login: POST /api/v1/auth/login")
print("Register new  : POST /api/v1/auth/register")
