from datetime import datetime, timezone, timedelta
from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import EmailStr
from app import models, schemas
from app.database import get_db
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["customer-auth"])

CANCEL_WINDOW_HOURS = 2
NON_CANCELLABLE_STATUSES = {"delivered", "in_progress", "confirmed"}


class CustomerRegister(schemas.OrmBase):
    full_name: str
    email: EmailStr
    password: str
    phone_number: Optional[str] = None
    terms_accepted: bool


@router.post("/register", response_model=schemas.UserOut, status_code=201)
def register(payload: CustomerRegister, db: Session = Depends(get_db)):
    if not payload.terms_accepted:
        raise HTTPException(status_code=400, detail="You must accept the terms and conditions")
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = models.User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        phone_number=payload.phone_number,
        role="customer",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.AdminLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    token = create_access_token({"sub": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email,
        "must_change_password": user.must_change_password,
    }


@router.put("/change-password", status_code=200)
def change_password(
    payload: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    current_user.must_change_password = False
    db.commit()
    return {"message": "Password changed successfully"}


@router.get("/my-orders", response_model=List[schemas.OrderOut])
def my_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    orders = (
        db.query(models.Order)
        .options(joinedload(models.Order.items))
        .filter(models.Order.customer_id == current_user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )
    return orders


@router.post("/my-orders/{order_id}/cancel", status_code=200)
def cancel_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    order = (
        db.query(models.Order)
        .filter(models.Order.id == order_id, models.Order.customer_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status in NON_CANCELLABLE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel an order with status '{order.status}'"
        )
    if order.status == "cancelled":
        raise HTTPException(status_code=400, detail="Order is already cancelled")
    now = datetime.now(timezone.utc)
    order_time = order.created_at
    if order_time.tzinfo is None:
        order_time = order_time.replace(tzinfo=timezone.utc)
    if now - order_time > timedelta(hours=CANCEL_WINDOW_HOURS):
        raise HTTPException(
            status_code=400,
            detail="Cancellation window has passed (orders can only be cancelled within 2 hours)"
        )
    order.status = "cancelled"
    db.commit()
    return {"message": "Order cancelled successfully", "order_number": order.order_number}
