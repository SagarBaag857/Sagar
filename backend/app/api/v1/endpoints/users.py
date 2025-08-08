from fastapi import APIRouter, Depends
from app.core.security import get_current_user_optional

router = APIRouter()

@router.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user_optional)):
    return {
        "user_id": user_id or "demo_user",
        "name": "Demo User",
        "email": "demo@example.com",
        "preferences": {
            "dietary_restrictions": [],
            "cooking_level": "intermediate"
        }
    }