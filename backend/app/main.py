import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine
from app import models
from app.routers import stores, products, orders, admin, store_owner, auth_customer

from sqlalchemy import text

models.Base.metadata.create_all(bind=engine)

# Idempotent column migrations — safe to run on every startup
_MIGRATIONS = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES users(id) ON DELETE SET NULL",
]
with engine.begin() as conn:
    for sql in _MIGRATIONS:
        conn.execute(text(sql))

app = FastAPI(
    title="Online Selling Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"
app.include_router(stores.router, prefix=PREFIX)
app.include_router(products.router, prefix=PREFIX)
app.include_router(orders.router, prefix=PREFIX)
app.include_router(admin.router, prefix=PREFIX)
app.include_router(store_owner.router, prefix=PREFIX)
app.include_router(auth_customer.router, prefix=PREFIX)


@app.get("/health")
def health():
    return {"status": "ok"}
