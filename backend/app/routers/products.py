from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: UUID, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.is_active == True,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ─── Reviews ──────────────────────────────────────────────────────────────────

@router.get("/{product_id}/reviews", response_model=List[schemas.ReviewOut])
def list_reviews(product_id: UUID, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return (
        db.query(models.ProductReview)
        .filter(models.ProductReview.product_id == product_id)
        .order_by(models.ProductReview.created_at.desc())
        .all()
    )


@router.get("/{product_id}/reviews/check", response_model=dict)
def check_reviewed(product_id: UUID, email: str, db: Session = Depends(get_db)):
    """Returns {reviewed: true/false} for a given email."""
    exists = db.query(models.ProductReview).filter(
        models.ProductReview.product_id == product_id,
        models.ProductReview.reviewer_email == email,
    ).first()
    return {"reviewed": bool(exists)}


@router.post("/{product_id}/reviews", response_model=schemas.ReviewOut, status_code=201)
def create_review(product_id: UUID, payload: schemas.ReviewCreate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.is_active == True,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Enforce one review per email per product
    existing = db.query(models.ProductReview).filter(
        models.ProductReview.product_id == product_id,
        models.ProductReview.reviewer_email == payload.reviewer_email,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You have already reviewed this product")

    review = models.ProductReview(product_id=product_id, **payload.model_dump())
    db.add(review)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already reviewed this product")
    db.refresh(review)
    return review
