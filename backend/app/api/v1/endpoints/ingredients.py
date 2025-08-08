"""
Ingredients API endpoints
Handle ingredient detection, management, and image processing
"""

import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from loguru import logger

from app.core.security import get_current_user_optional
from app.services.ml_service import ml_service
from app.core.config import settings

router = APIRouter()


# Pydantic models for request/response
class IngredientDetectionResponse(BaseModel):
    """Response model for ingredient detection"""
    success: bool = True
    message: str = "Ingredients detected successfully"
    detected_ingredients: List[Dict[str, Any]] = []
    processing_time_ms: int = 0
    confidence_threshold: float = 0.5
    total_ingredients: int = 0


class ManualIngredientsRequest(BaseModel):
    """Request model for manual ingredient input"""
    ingredients: List[str] = Field(..., description="List of ingredient names")
    quantities: Optional[List[str]] = Field(None, description="Optional quantities for ingredients")
    notes: Optional[str] = Field(None, description="Additional notes")


class IngredientSuggestionResponse(BaseModel):
    """Response model for ingredient suggestions"""
    suggestions: List[str] = []
    categories: Dict[str, List[str]] = {}


@router.post("/detect-from-image", response_model=IngredientDetectionResponse)
async def detect_ingredients_from_image(
    image: UploadFile = File(..., description="Fridge image for ingredient detection"),
    enhance_quality: bool = Form(True, description="Whether to enhance image quality"),
    user_id: Optional[str] = Depends(get_current_user_optional)
):
    """
    Detect ingredients from uploaded fridge image using computer vision
    
    This endpoint accepts an image file and uses AI computer vision to detect
    and identify ingredients visible in the image. Perfect for scanning fridge contents!
    """
    import time
    start_time = time.time()
    
    try:
        # Validate file type
        if not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Check file size
        if image.size and image.size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Image too large. Maximum size: {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB"
            )
        
        # Read image data
        image_data = await image.read()
        
        if not image_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty image file"
            )
        
        logger.info(f"Processing image: {image.filename}, size: {len(image_data)} bytes")
        
        # Detect ingredients using ML service
        detected_ingredients = await ml_service.detect_ingredients_from_image(
            image_data, 
            user_id or "anonymous"
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        logger.info(f"Detected {len(detected_ingredients)} ingredients in {processing_time}ms")
        
        return IngredientDetectionResponse(
            detected_ingredients=detected_ingredients,
            processing_time_ms=processing_time,
            confidence_threshold=settings.INGREDIENT_DETECTION_CONFIDENCE,
            total_ingredients=len(detected_ingredients)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error detecting ingredients: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process image"
        )


@router.post("/manual-input")
async def add_manual_ingredients(
    request: ManualIngredientsRequest,
    user_id: Optional[str] = Depends(get_current_user_optional)
):
    """
    Manually input ingredients when camera detection isn't available
    
    This endpoint allows users to manually type in their available ingredients
    instead of using image detection.
    """
    try:
        if not request.ingredients:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one ingredient is required"
            )
        
        # Clean and validate ingredients
        cleaned_ingredients = []
        for ingredient in request.ingredients:
            ingredient = ingredient.strip().lower()
            if ingredient and len(ingredient) > 1:
                cleaned_ingredients.append(ingredient)
        
        if not cleaned_ingredients:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid ingredients provided"
            )
        
        logger.info(f"Manual ingredients added: {cleaned_ingredients}")
        
        # Format as detection result for consistency
        manual_ingredients = []
        for i, ingredient in enumerate(cleaned_ingredients):
            quantity = None
            if request.quantities and i < len(request.quantities):
                quantity = request.quantities[i]
            
            manual_ingredients.append({
                "detected_name": ingredient,
                "matched_name": ingredient,
                "confidence": 1.0,
                "match_score": 1.0,
                "source": "manual_input",
                "quantity": quantity,
                "final_confidence": 1.0
            })
        
        return {
            "success": True,
            "message": f"Added {len(manual_ingredients)} ingredients manually",
            "ingredients": manual_ingredients,
            "total_ingredients": len(manual_ingredients)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding manual ingredients: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process manual ingredients"
        )


@router.get("/suggestions", response_model=IngredientSuggestionResponse)
async def get_ingredient_suggestions(
    query: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 20
):
    """
    Get ingredient suggestions and categories for autocomplete
    
    Helps users find and spell ingredient names correctly with autocomplete suggestions.
    """
    try:
        # Common ingredient suggestions organized by category
        ingredient_database = {
            "proteins": [
                "chicken breast", "ground beef", "salmon", "eggs", "tofu",
                "bacon", "ham", "turkey", "pork chops", "shrimp", "tuna"
            ],
            "vegetables": [
                "tomatoes", "onions", "carrots", "broccoli", "spinach",
                "bell peppers", "mushrooms", "garlic", "potatoes", "lettuce",
                "cucumber", "zucchini", "asparagus", "cauliflower"
            ],
            "fruits": [
                "apples", "bananas", "oranges", "lemons", "limes",
                "strawberries", "blueberries", "avocados", "grapes"
            ],
            "grains": [
                "rice", "pasta", "bread", "quinoa", "oats", "flour", "noodles"
            ],
            "dairy": [
                "milk", "cheese", "yogurt", "butter", "cream", "sour cream"
            ],
            "pantry": [
                "olive oil", "salt", "black pepper", "garlic powder",
                "onion powder", "paprika", "cumin", "oregano", "basil",
                "soy sauce", "vinegar", "honey", "sugar"
            ],
            "herbs_spices": [
                "basil", "oregano", "thyme", "rosemary", "cilantro",
                "parsley", "mint", "dill", "sage", "cinnamon"
            ]
        }
        
        suggestions = []
        
        if category and category in ingredient_database:
            suggestions = ingredient_database[category][:limit]
        elif query:
            # Search across all categories
            query = query.lower()
            for cat_ingredients in ingredient_database.values():
                for ingredient in cat_ingredients:
                    if query in ingredient.lower() and ingredient not in suggestions:
                        suggestions.append(ingredient)
                        if len(suggestions) >= limit:
                            break
                if len(suggestions) >= limit:
                    break
        else:
            # Return popular ingredients from each category
            for cat, ingredients in ingredient_database.items():
                suggestions.extend(ingredients[:3])
            suggestions = suggestions[:limit]
        
        return IngredientSuggestionResponse(
            suggestions=suggestions,
            categories=ingredient_database
        )
        
    except Exception as e:
        logger.error(f"Error getting ingredient suggestions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get suggestions"
        )


@router.get("/supported")
async def get_supported_ingredients():
    """
    Get list of ingredients supported by the computer vision model
    
    Returns the ingredients that can be reliably detected from images.
    """
    try:
        if hasattr(ml_service.cv_service, 'get_supported_ingredients'):
            supported = await ml_service.cv_service.get_supported_ingredients()
        else:
            # Fallback list of supported ingredients
            supported = [
                "apple", "banana", "orange", "tomato", "carrot", "potato",
                "onion", "garlic", "bell pepper", "broccoli", "lettuce",
                "cucumber", "mushroom", "egg", "milk", "cheese", "bread",
                "chicken", "beef", "fish", "rice", "pasta"
            ]
        
        return {
            "success": True,
            "supported_ingredients": sorted(supported),
            "total_supported": len(supported),
            "message": "These ingredients can be detected from images"
        }
        
    except Exception as e:
        logger.error(f"Error getting supported ingredients: {e}")
        return {
            "success": False,
            "supported_ingredients": [],
            "total_supported": 0,
            "message": "Could not load supported ingredients"
        }


@router.get("/categories")
async def get_ingredient_categories():
    """
    Get ingredient categories for organizing and filtering
    """
    try:
        categories = {
            "proteins": {
                "name": "Proteins",
                "description": "Meat, fish, eggs, and plant proteins",
                "icon": "🥩",
                "color": "#E53E3E"
            },
            "vegetables": {
                "name": "Vegetables",
                "description": "Fresh and frozen vegetables",
                "icon": "🥬",
                "color": "#38A169"
            },
            "fruits": {
                "name": "Fruits",
                "description": "Fresh and dried fruits",
                "icon": "🍎",
                "color": "#D69E2E"
            },
            "grains": {
                "name": "Grains & Starches",
                "description": "Rice, pasta, bread, and cereals",
                "icon": "🌾",
                "color": "#B7791F"
            },
            "dairy": {
                "name": "Dairy",
                "description": "Milk, cheese, yogurt, and dairy products",
                "icon": "🥛",
                "color": "#3182CE"
            },
            "pantry": {
                "name": "Pantry Staples",
                "description": "Oils, condiments, and basics",
                "icon": "🏺",
                "color": "#805AD5"
            }
        }
        
        return {
            "success": True,
            "categories": categories,
            "total_categories": len(categories)
        }
        
    except Exception as e:
        logger.error(f"Error getting categories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get categories"
        )