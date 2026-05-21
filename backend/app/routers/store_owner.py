from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import verify_password, create_access_token, get_current_store_owner

router = APIRouter(prefix="/store-owner", tags=["store-owner"])


# ─── Auth ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=schemas.Token)
def store_owner_login(payload: schemas.AdminLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.role not in ("store_owner", "super_admin"):
        raise HTTPException(status_code=403, detail="Not a store owner account")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    token = create_access_token({"sub": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email,
        "must_change_password": user.must_change_password,
    }


# ─── My Store ─────────────────────────────────────────────────────────────────

@router.get("/my-store", response_model=schemas.StoreOut)
def get_my_store(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_store_owner),
):
    store = db.query(models.Store).filter(models.Store.owner_id == current_user.id).first()
    if not store:
        raise HTTPException(status_code=404, detail="No store assigned to your account")
    out = schemas.StoreOut.model_validate(store)
    out.product_count = len(store.products)
    return out


@router.put("/my-store", response_model=schemas.StoreOut)
def update_my_store(
    payload: schemas.StoreUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_store_owner),
):
    store = db.query(models.Store).filter(models.Store.owner_id == current_user.id).first()
    if not store:
        raise HTTPException(status_code=404, detail="No store assigned to your account")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(store, field, value)
    db.commit()
    db.refresh(store)
    out = schemas.StoreOut.model_validate(store)
    out.product_count = len(store.products)
    return out


# ─── Products (own store only) ────────────────────────────────────────────────

def _get_owned_store(user: models.User, db: Session) -> models.Store:
    store = db.query(models.Store).filter(models.Store.owner_id == user.id).first()
    if not store:
        raise HTTPException(status_code=404, detail="No store assigned to your account")
    return store


@router.get("/products", response_model=List[schemas.ProductOut])
def list_my_products(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_store_owner),
):
    store = _get_owned_store(current_user, db)
    return db.query(models.Product).filter(models.Product.store_id == store.id).all()


@router.post("/products", response_model=schemas.ProductOut, status_code=201)
def create_my_product(
    payload: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_store_owner),
):
    store = _get_owned_store(current_user, db)
    data = payload.model_dump()
    data["store_id"] = store.id
    product = models.Product(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=schemas.ProductOut)
def update_my_product(
    product_id: UUID,
    payload: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_store_owner),
):
    store = _get_owned_store(current_user, db)
    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.store_id == store.id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=204)
def delete_my_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_store_owner),
):
    store = _get_owned_store(current_user, db)
    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.store_id == store.id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()


# ─── Orders (own store only) ──────────────────────────────────────────────────

@router.get("/orders", response_model=List[schemas.OrderOut])
def list_my_orders(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_store_owner),
):
    store = _get_owned_store(current_user, db)
    query = db.query(models.Order).filter(models.Order.store_id == store.id)
    if status:
        query = query.filter(models.Order.status == status)
    return query.order_by(models.Order.created_at.desc()).all()


@router.get("/orders/{order_id}", response_model=schemas.OrderOut)
def get_my_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_store_owner),
):
    store = _get_owned_store(current_user, db)
    order = db.query(models.Order).filter(
        models.Order.id == order_id,
        models.Order.store_id == store.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/orders/{order_id}/status", response_model=schemas.OrderOut)
def update_my_order_status(
    order_id: UUID,
    payload: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_store_owner),
):
    store = _get_owned_store(current_user, db)
    order = db.query(models.Order).filter(
        models.Order.id == order_id,
        models.Order.store_id == store.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order


# ─── Settings ─────────────────────────────────────────────────────────────────

@router.get("/settings", response_model=schemas.SettingsOut)
def get_my_settings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_store_owner),
):
    store = _get_owned_store(current_user, db)
    s = db.query(models.AdminSettings).filter(
        models.AdminSettings.store_id == store.id
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Settings not configured yet")
    return s


@router.put("/settings", response_model=schemas.SettingsOut)
def update_my_settings(
    payload: schemas.SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_store_owner),
):
    store = _get_owned_store(current_user, db)
    s = db.query(models.AdminSettings).filter(
        models.AdminSettings.store_id == store.id
    ).first()
    if not s:
        s = models.AdminSettings(store_id=store.id)
        db.add(s)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(s, field, value)
    db.commit()
    db.refresh(s)
    return s
