"""Ingredient management endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database.database import get_db
from .auth import get_current_user
from ..models.user import User

router = APIRouter()

@router.get("/")
async def get_ingredients(db: Session = Depends(get_db)):
    """Get all available ingredients."""
    return {"message": "Ingredients list endpoint - implementation pending"}

@router.post("/")
async def create_ingredient(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new ingredient."""
    return {"message": "Create ingredient endpoint - implementation pending"}

@router.get("/my-ingredients")
async def get_user_ingredients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's ingredient inventory."""
    return {"message": "User ingredients endpoint - implementation pending"}