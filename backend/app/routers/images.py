"""Image upload and processing endpoints."""

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from ..database.database import get_db
from .auth import get_current_user
from ..models.user import User

router = APIRouter()

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and analyze fridge image."""
    return {"message": "Image upload endpoint - implementation pending"}

@router.post("/analyze")
async def analyze_image(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze uploaded image for ingredients."""
    return {"message": "Image analysis endpoint - implementation pending"}