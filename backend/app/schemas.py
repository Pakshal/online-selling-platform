]from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Any, Dict
from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator


# ─── Shared ───────────────────────────────────────────────────────────────────

class OrmBase(BaseModel):
    model_config = {"from_attributes": True}


# ─── Store ────────────────────────────────────────────────────────────────────

class StoreCreate(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    admin_email: EmailStr
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = True


class StoreUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    admin_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class StoreOut(OrmBase):
    id: UUID
    owner_id: Optional[UUID] = None
    name: str
    description: Optional[str]
    logo_url: Optional[str]
    admin_email: str
    contact_phone: Optional[str]
    address: Optional[str]
    is_active: bool
    created_at: datetime
    product_count: Optional[int] = 0


# ─── Product ──────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    store_id: Optional[UUID] = None   # injected server-side for store-owner; required for admin
    name: str
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int = 0
    category: Optional[str] = None
    images: List[str] = []
    specifications: Dict[str, Any] = {}
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    category: Optional[str] = None
    images: Optional[List[str]] = None
    specifications: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class ProductOut(OrmBase):
    id: UUID
    store_id: UUID
    name: str
    description: Optional[str]
    price: Decimal
    stock_quantity: int
    category: Optional[str]
    images: List[str]
    specifications: Dict[str, Any]
    is_active: bool
    created_at: datetime


# ─── Reviews ──────────────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    reviewer_name: str
    reviewer_email: EmailStr
    rating: int
    title: Optional[str] = None
    body: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewOut(OrmBase):
    id: UUID
    product_id: UUID
    reviewer_name: str
    rating: int
    title: Optional[str]
    body: Optional[str]
    created_at: datetime


# ─── Order ────────────────────────────────────────────────────────────────────

class CustomerInfo(BaseModel):
    name: str
    phone: str
    email: EmailStr
    address: str
    city: str
    pincode: str


class OrderItemIn(BaseModel):
    product_id: UUID
    product_name: str
    price: Decimal
    quantity: int


class OrderCreate(BaseModel):
    store_id: UUID
    customer: CustomerInfo
    items: List[OrderItemIn]
    notes: Optional[str] = None
    subtotal: Decimal
    delivery_charges: Decimal = Decimal("0")
    total_amount: Decimal

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v: List) -> List:
        if not v:
            raise ValueError("Order must have at least one item")
        return v


class OrderItemOut(OrmBase):
    id: UUID
    product_id: Optional[UUID]
    product_name: str
    product_price: Decimal
    quantity: int
    subtotal: Decimal


class OrderOut(OrmBase):
    id: UUID
    order_number: str
    store_id: UUID
    customer_name: str
    customer_phone: str
    customer_email: str
    delivery_address: str
    city: Optional[str]
    pincode: Optional[str]
    notes: Optional[str]
    subtotal: Decimal
    delivery_charges: Decimal
    total_amount: Decimal
    status: str
    created_at: datetime
    items: List[OrderItemOut] = []


class OrderStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        allowed = {"pending", "confirmed", "delivered", "cancelled"}
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v


# ─── Auth ─────────────────────────────────────────────────────────────────────

class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    must_change_password: Optional[bool] = False


# ─── User ─────────────────────────────────────────────────────────────────────

class StoreOwnerCreate(BaseModel):
    """Used by Super Admin to create a store owner account."""
    full_name: str
    email: EmailStr
    password: str


class UserOut(OrmBase):
    id: UUID
    full_name: Optional[str]
    email: str
    role: str
    phone_number: Optional[str] = None
    is_active: bool
    created_at: datetime


class StoreWithOwnerCreate(BaseModel):
    """Super Admin creates store + owner in one call. Password auto-generated if omitted."""
    store_name: str
    store_description: Optional[str] = None
    store_logo_url: Optional[str] = None
    admin_email: EmailStr
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    owner_full_name: str
    owner_email: EmailStr
    owner_password: Optional[str] = None  # auto-generated if not provided


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ProvisionStoreOut(OrmBase):
    """Returned by provision-store — includes generated credentials."""
    id: UUID
    name: str
    admin_email: str
    owner_email: str
    generated_password: Optional[str] = None  # only set when auto-generated
    product_count: Optional[int] = 0


# ─── Settings ─────────────────────────────────────────────────────────────────

class SettingsUpdate(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    default_delivery_charge: Optional[Decimal] = None
    currency: Optional[str] = None


class SettingsOut(OrmBase):
    id: UUID
    store_id: UUID
    smtp_host: Optional[str]
    smtp_port: Optional[int]
    smtp_username: Optional[str]
    default_delivery_charge: Optional[Decimal]
    currency: Optional[str]
    updated_at: datetime
