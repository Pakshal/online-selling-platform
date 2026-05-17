from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/stores", tags=["stores"])


@router.get("", response_model=List[schemas.StoreOut])
def list_stores(db: Session = Depends(get_db)):
    stores = db.query(models.Store).filter(models.Store.is_active == True).all()
    result = []
    for store in stores:
        out = schemas.StoreOut.model_validate(store)
        out.product_count = len([p for p in store.products if p.is_active])
        result.append(out)
    return result


@router.get("/{store_id}", response_model=schemas.StoreOut)
def get_store(store_id: UUID, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(
        models.Store.id == store_id, models.Store.is_active == True
    ).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    out = schemas.StoreOut.model_validate(store)
    out.product_count = len([p for p in store.products if p.is_active])
    return out


@router.get("/{store_id}/products", response_model=List[schemas.ProductOut])
def list_store_products(
    store_id: UUID,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Product).filter(
        models.Product.store_id == store_id,
        models.Product.is_active == True,
    )
    if category:
        query = query.filter(models.Product.category == category)
    return query.all()
