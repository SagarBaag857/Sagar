"""
Main API Router
Centralized routing for all API endpoints
"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    ingredients,
    recipes,
    users,
    auth,
    upload
)

# Create main API router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"]
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
)

api_router.include_router(
    ingredients.router,
    prefix="/ingredients",
    tags=["ingredients"]
)

api_router.include_router(
    recipes.router,
    prefix="/recipes",
    tags=["recipes"]
)

api_router.include_router(
    upload.router,
    prefix="/upload",
    tags=["file upload"]
)