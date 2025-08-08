"""
Recipes API endpoints
Handle recipe generation, management, and budget mode
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from loguru import logger

from app.core.security import get_current_user_optional
from app.services.ml_service import ml_service
from app.core.config import settings

router = APIRouter()


# Pydantic models
class RecipeGenerationRequest(BaseModel):
    """Request model for recipe generation"""
    ingredients: List[str] = Field(..., description="Available ingredients")
    preferences: Optional[Dict[str, Any]] = Field(default_factory=dict, description="User preferences")
    count: int = Field(3, ge=1, le=10, description="Number of recipes to generate")
    meal_type: Optional[str] = Field(None, description="Preferred meal type")
    cuisine_type: Optional[str] = Field(None, description="Preferred cuisine")
    dietary_restrictions: List[str] = Field(default_factory=list)
    max_cooking_time: Optional[int] = Field(None, ge=5, le=300, description="Max cooking time in minutes")
    serving_size: int = Field(4, ge=1, le=12, description="Number of servings")
    difficulty_level: Optional[str] = Field(None, description="Cooking difficulty preference")


class BudgetRecipeRequest(BaseModel):
    """Request model for budget recipe generation"""
    ingredients: List[str] = Field(..., description="Available ingredients")
    budget_limit: float = Field(..., ge=1.0, le=100.0, description="Budget limit per serving in USD")
    preferences: Optional[Dict[str, Any]] = Field(default_factory=dict)
    count: int = Field(3, ge=1, le=5, description="Number of budget recipes")
    serving_size: int = Field(4, ge=1, le=12, description="Number of servings")


class RecipeResponse(BaseModel):
    """Response model for recipe generation"""
    success: bool = True
    message: str = "Recipes generated successfully"
    recipes: List[Dict[str, Any]] = []
    total_recipes: int = 0
    generation_time_ms: int = 0
    user_preferences: Dict[str, Any] = {}


@router.post("/generate", response_model=RecipeResponse)
async def generate_recipes(
    request: RecipeGenerationRequest,
    user_id: Optional[str] = Depends(get_current_user_optional)
):
    """
    Generate personalized recipes based on available ingredients
    
    This is the main recipe generation endpoint that uses AI to create
    custom recipes based on your ingredients and preferences.
    """
    import time
    start_time = time.time()
    
    try:
        if not request.ingredients:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one ingredient is required"
            )
        
        if len(request.ingredients) > settings.MAX_INGREDIENTS_PER_REQUEST:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Too many ingredients. Maximum: {settings.MAX_INGREDIENTS_PER_REQUEST}"
            )
        
        logger.info(f"Generating {request.count} recipes from {len(request.ingredients)} ingredients")
        
        # Prepare user preferences
        user_preferences = request.preferences.copy()
        user_preferences.update({
            "meal_type": request.meal_type,
            "cuisine_preference": request.cuisine_type,
            "dietary_restrictions": request.dietary_restrictions,
            "max_cooking_time": request.max_cooking_time or 60,
            "serving_size": request.serving_size,
            "cooking_level": request.difficulty_level or "intermediate",
            "budget_mode": False
        })
        
        # Generate recipes using ML service
        recipes = await ml_service.generate_recipes(
            request.ingredients,
            user_preferences,
            request.count
        )
        
        generation_time = int((time.time() - start_time) * 1000)
        
        logger.info(f"Generated {len(recipes)} recipes in {generation_time}ms")
        
        return RecipeResponse(
            recipes=recipes,
            total_recipes=len(recipes),
            generation_time_ms=generation_time,
            user_preferences=user_preferences
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating recipes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate recipes"
        )


@router.post("/generate-budget", response_model=RecipeResponse)
async def generate_budget_recipes(
    request: BudgetRecipeRequest,
    user_id: Optional[str] = Depends(get_current_user_optional)
):
    """
    Generate budget-friendly recipes with cost optimization
    
    Perfect for when you want delicious meals that won't break the bank!
    This endpoint focuses on cost-effective recipes while maintaining nutrition and taste.
    """
    import time
    start_time = time.time()
    
    try:
        if not request.ingredients:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one ingredient is required"
            )
        
        logger.info(f"Generating {request.count} budget recipes (${request.budget_limit}/serving)")
        
        # Prepare user preferences for budget mode
        user_preferences = request.preferences.copy()
        user_preferences.update({
            "budget_mode": True,
            "budget_per_meal": request.budget_limit,
            "serving_size": request.serving_size,
            "max_cooking_time": 45,  # Keep it simple for budget mode
            "cooking_level": "beginner",  # Accessible recipes
            "focus_on_value": True
        })
        
        # Generate budget recipes
        recipes = await ml_service.generate_budget_recipes(
            request.ingredients,
            user_preferences,
            request.budget_limit,
            request.count
        )
        
        generation_time = int((time.time() - start_time) * 1000)
        
        logger.info(f"Generated {len(recipes)} budget recipes in {generation_time}ms")
        
        return RecipeResponse(
            recipes=recipes,
            total_recipes=len(recipes),
            generation_time_ms=generation_time,
            user_preferences=user_preferences,
            message=f"Budget recipes generated under ${request.budget_limit} per serving"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating budget recipes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate budget recipes"
        )


@router.get("/quick-recipes")
async def get_quick_recipes(
    ingredients: str = Query(..., description="Comma-separated list of ingredients"),
    max_time: int = Query(30, ge=5, le=60, description="Maximum cooking time in minutes"),
    count: int = Query(3, ge=1, le=5, description="Number of recipes")
):
    """
    Get quick recipe suggestions for busy days
    
    Perfect for when you need something fast and delicious!
    """
    try:
        ingredient_list = [ing.strip() for ing in ingredients.split(",") if ing.strip()]
        
        if not ingredient_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one ingredient is required"
            )
        
        # Quick recipe preferences
        preferences = {
            "max_cooking_time": max_time,
            "cooking_level": "easy",
            "meal_type": "lunch",
            "focus_on_speed": True,
            "serving_size": 2
        }
        
        recipes = await ml_service.generate_recipes(
            ingredient_list,
            preferences,
            count
        )
        
        # Filter for actual quick recipes
        quick_recipes = [r for r in recipes if r.get("total_time", 60) <= max_time]
        
        return {
            "success": True,
            "message": f"Quick recipes under {max_time} minutes",
            "recipes": quick_recipes,
            "total_recipes": len(quick_recipes)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quick recipes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get quick recipes"
        )


@router.get("/random")
async def get_random_recipe(
    cuisine: Optional[str] = Query(None, description="Cuisine type"),
    dietary: Optional[str] = Query(None, description="Dietary restriction"),
    difficulty: Optional[str] = Query(None, description="Difficulty level")
):
    """
    Get a random recipe for inspiration
    
    Great for when you want to try something new but aren't sure what!
    """
    try:
        # Common ingredients for random recipes
        common_ingredients = [
            "chicken breast", "onion", "garlic", "tomatoes", "olive oil",
            "salt", "pepper", "rice", "potatoes", "carrots"
        ]
        
        preferences = {
            "cuisine_preference": cuisine or "international",
            "cooking_level": difficulty or "intermediate",
            "dietary_restrictions": [dietary] if dietary else [],
            "serving_size": 4,
            "creativity_level": "high"
        }
        
        recipes = await ml_service.generate_recipes(
            common_ingredients,
            preferences,
            1
        )
        
        return {
            "success": True,
            "message": "Random recipe generated",
            "recipe": recipes[0] if recipes else None,
            "inspiration": True
        }
        
    except Exception as e:
        logger.error(f"Error getting random recipe: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get random recipe"
        )


@router.get("/popular")
async def get_popular_recipes(
    limit: int = Query(10, ge=1, le=20, description="Number of recipes to return"),
    cuisine: Optional[str] = Query(None, description="Filter by cuisine"),
    dietary: Optional[str] = Query(None, description="Filter by dietary restriction")
):
    """
    Get popular and trending recipes
    
    See what everyone else is cooking!
    """
    try:
        # Mock popular recipes (in a real app, this would come from database analytics)
        popular_recipes = [
            {
                "id": "1",
                "title": "One-Pot Chicken and Rice",
                "description": "Easy, flavorful, and filling meal perfect for busy weeknights",
                "prep_time": 15,
                "cook_time": 30,
                "difficulty_level": "easy",
                "cuisine_type": "american",
                "rating": 4.8,
                "total_ratings": 1250,
                "popularity_score": 95,
                "tags": ["one-pot", "family-friendly", "gluten-free"]
            },
            {
                "id": "2",
                "title": "Vegetarian Pasta Primavera",
                "description": "Fresh vegetables and pasta in a light, creamy sauce",
                "prep_time": 20,
                "cook_time": 15,
                "difficulty_level": "easy",
                "cuisine_type": "italian",
                "rating": 4.6,
                "total_ratings": 890,
                "popularity_score": 88,
                "tags": ["vegetarian", "quick", "colorful"]
            },
            {
                "id": "3",
                "title": "Budget-Friendly Beef Stir Fry",
                "description": "Affordable and delicious stir fry with seasonal vegetables",
                "prep_time": 15,
                "cook_time": 10,
                "difficulty_level": "easy",
                "cuisine_type": "asian",
                "rating": 4.7,
                "total_ratings": 756,
                "popularity_score": 85,
                "tags": ["budget-friendly", "quick", "high-protein"]
            }
        ]
        
        # Apply filters
        filtered_recipes = popular_recipes
        
        if cuisine:
            filtered_recipes = [r for r in filtered_recipes if r["cuisine_type"] == cuisine.lower()]
        
        if dietary:
            filtered_recipes = [r for r in filtered_recipes if dietary.lower() in r.get("tags", [])]
        
        return {
            "success": True,
            "message": "Popular recipes retrieved",
            "recipes": filtered_recipes[:limit],
            "total_recipes": len(filtered_recipes),
            "filters_applied": {
                "cuisine": cuisine,
                "dietary": dietary,
                "limit": limit
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting popular recipes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get popular recipes"
        )


@router.get("/nutrition-analysis/{recipe_id}")
async def get_nutrition_analysis(recipe_id: str):
    """
    Get detailed nutrition analysis for a specific recipe
    """
    try:
        # In a real app, you'd fetch from database
        # For now, return mock nutrition data
        nutrition_analysis = {
            "recipe_id": recipe_id,
            "per_serving": {
                "calories": 385,
                "protein": 28.5,
                "carbohydrates": 42.1,
                "fat": 12.3,
                "fiber": 5.2,
                "sugar": 8.7,
                "sodium": 580,
                "cholesterol": 65
            },
            "vitamins": {
                "vitamin_a": 2400,  # IU
                "vitamin_c": 45,    # mg
                "vitamin_d": 0,     # IU
                "vitamin_e": 2.1,   # mg
                "vitamin_k": 85     # mcg
            },
            "minerals": {
                "calcium": 120,     # mg
                "iron": 3.2,       # mg
                "magnesium": 85,    # mg
                "potassium": 680,   # mg
                "zinc": 2.8        # mg
            },
            "health_score": 8.2,
            "dietary_flags": {
                "high_protein": True,
                "low_sodium": False,
                "heart_healthy": True,
                "diabetes_friendly": True
            },
            "allergen_info": {
                "contains": ["gluten"],
                "may_contain": ["nuts"],
                "free_from": ["dairy", "eggs", "soy"]
            }
        }
        
        return {
            "success": True,
            "nutrition_analysis": nutrition_analysis,
            "message": "Detailed nutrition analysis"
        }
        
    except Exception as e:
        logger.error(f"Error getting nutrition analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get nutrition analysis"
        )