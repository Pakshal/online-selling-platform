import random
import string
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.email_service import send_order_notification
from app.auth import _get_user_from_token

router = APIRouter(prefix="/orders", tags=["orders"])

_optional_bearer = OAuth2PasswordBearer(tokenUrl="/api/v1/admin/login", auto_error=False)


def _get_optional_user(
    token: Optional[str] = Depends(_optional_bearer),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    """Returns the logged-in user if a valid token is present, otherwise None."""
    if not token:
        return None
    try:
        return _get_user_from_token(token, db)
    except Exception:
        return None


def _generate_order_number() -> str:
    suffix = "".join(random.choices(string.digits, k=6))
    return f"ORD-2026-{suffix}"


@router.post("", response_model=dict, status_code=201)
def create_order(
    payload: schemas.OrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    store = db.query(models.Store).filter(
        models.Store.id == payload.store_id,
        models.Store.is_active == True,
    ).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    order = models.Order(
        order_number=_generate_order_number(),
        store_id=payload.store_id,
        customer_name=payload.customer.name,
        customer_phone=payload.customer.phone,
        customer_email=payload.customer.email,
        delivery_address=payload.customer.address,
        city=payload.customer.city,
        pincode=payload.customer.pincode,
        notes=payload.notes,
        subtotal=payload.subtotal,
        delivery_charges=payload.delivery_charges,
        total_amount=payload.total_amount,
    )
    db.add(order)
    db.flush()

    for item in payload.items:
        db.add(models.OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=item.product_name,
            product_price=item.price,
            quantity=item.quantity,
            subtotal=item.price * item.quantity,
        ))

    db.commit()
    db.refresh(order)

    order_id = order.id
    admin_email = store.admin_email
    background_tasks.add_task(send_order_notification, order_id, admin_email)

    return {
        "success": True,
        "orderId": str(order.id),
        "orderNumber": order.order_number,
        "message": "Your order has been successfully placed!",
        "estimatedDelivery": "2-3 business days",
    }


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: UUID, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
