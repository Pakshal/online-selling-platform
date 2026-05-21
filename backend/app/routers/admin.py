from typing import List
import secrets
import string
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import (
    hash_password, verify_password, create_access_token,
    get_current_super_admin,
)

router = APIRouter(prefix="/admin", tags=["super-admin"])


def _generate_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


# ─── Auth ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.AdminLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.role not in ("super_admin", "store_owner"):
        raise HTTPException(status_code=403, detail="Not an admin user")
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "full_name": user.full_name, "email": user.email}


# ─── Store Owners ─────────────────────────────────────────────────────────────

@router.post("/store-owners", response_model=schemas.UserOut, status_code=201)
def create_store_owner(
    payload: schemas.StoreOwnerCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_super_admin),
):
    """Create a store owner account (credentials sent to them out-of-band)."""
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = models.User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role="store_owner",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/store-owners", response_model=List[schemas.UserOut])
def list_store_owners(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_super_admin),
):
    return db.query(models.User).filter(models.User.role == "store_owner").all()


@router.post("/provision-store", response_model=schemas.ProvisionStoreOut, status_code=201)
def provision_store_with_owner(
    payload: schemas.StoreWithOwnerCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_super_admin),
):
    """Create a store owner account + store. Auto-generates password if not provided."""
    if db.query(models.User).filter(models.User.email == payload.owner_email).first():
        raise HTTPException(status_code=409, detail="Owner email already registered")

    auto_generated = payload.owner_password is None
    raw_password = payload.owner_password or _generate_password()

    owner = models.User(
        full_name=payload.owner_full_name,
        email=payload.owner_email,
        hashed_password=hash_password(raw_password),
        role="store_owner",
        must_change_password=True,  # always force change on first login
    )
    db.add(owner)
    db.flush()

    store = models.Store(
        owner_id=owner.id,
        name=payload.store_name,
        description=payload.store_description,
        logo_url=payload.store_logo_url,
        admin_email=payload.admin_email,
        contact_phone=payload.contact_phone,
        address=payload.address,
    )
    db.add(store)
    db.commit()
    db.refresh(store)

    return schemas.ProvisionStoreOut(
        id=store.id,
        name=store.name,
        admin_email=store.admin_email,
        owner_email=owner.email,
        generated_password=raw_password if auto_generated else None,
        product_count=0,
    )


# ─── Stores ───────────────────────────────────────────────────────────────────

@router.get("/stores", response_model=List[schemas.StoreOut])
def admin_list_stores(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_super_admin),
):
    stores = db.query(models.Store).all()
    result = []
    for store in stores:
        out = schemas.StoreOut.model_validate(store)
        out.product_count = len(store.products)
        result.append(out)
    return result


@router.post("/stores", response_model=schemas.StoreOut, status_code=201)
def create_store(
    payload: schemas.StoreCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_super_admin),
):
    store = models.Store(**payload.model_dump())
    db.add(store)
    db.commit()
    db.refresh(store)
    out = schemas.StoreOut.model_validate(store)
    out.product_count = 0
    return out


@router.put("/stores/{store_id}", response_model=schemas.StoreOut)
def update_store(
    store_id: UUID,
    payload: schemas.StoreUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_super_admin),
):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(store, field, value)
    db.commit()
    db.refresh(store)
    out = schemas.StoreOut.model_validate(store)
    out.product_count = len(store.products)
    return out


@router.delete("/stores/{store_id}", status_code=204)
def delete_store(
    store_id: UUID,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_super_admin),
):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    db.delete(store)
    db.commit()


# ─── Products ─────────────────────────────────────────────────────────────────

@router.post("/stores/{store_id}/products", response_model=schemas.ProductOut, status_code=201)
def create_product(
    store_id: UUID,
    payload: schemas.ProductCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_super_admin),
):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    data = payload.model_dump()
    data["store_id"] = store_id
    product = models.Product(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: UUID,
    payload: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_super_admin),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=204)
def delete_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_super_admin),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()


# ─── Orders ───────────────────────────────────────────────────────────────────

@router.get("/orders", response_model=List[schemas.OrderOut])
def list_orders(
    status: str | None = None,
    store_id: UUID | None = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_super_admin),
):
    query = db.query(models.Order)
    if status:
        query = query.filter(models.Order.status == status)
    if store_id:
        query = query.filter(models.Order.store_id == store_id)
    return query.order_by(models.Order.created_at.desc()).all()


@router.put("/orders/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(
    order_id: UUID,
    payload: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_super_admin),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order


# ─── Settings ─────────────────────────────────────────────────────────────────

@router.get("/settings/{store_id}", response_model=schemas.SettingsOut)
def get_settings(
    store_id: UUID,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_super_admin),
):
    s = db.query(models.AdminSettings).filter(
        models.AdminSettings.store_id == store_id
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Settings not found")
    return s


@router.put("/settings/{store_id}", response_model=schemas.SettingsOut)
def update_settings(
    store_id: UUID,
    payload: schemas.SettingsUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_super_admin),
):
    s = db.query(models.AdminSettings).filter(
        models.AdminSettings.store_id == store_id
    ).first()
    if not s:
        s = models.AdminSettings(store_id=store_id)
        db.add(s)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(s, field, value)
    db.commit()
    db.refresh(s)
    return s

