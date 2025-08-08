"""
Machine Learning Service
Wrapper service for all ML-related functionality
"""

import logging
from typing import List, Dict, Any
from app.services.cv_service import cv_service
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)


class MLService:
    """
    Main ML service that coordinates computer vision and AI services
    """
    
    def __init__(self):
        self.cv_service = cv_service
        self.ai_service = ai_service
        self.is_initialized = False
    
    async def initialize_models(self):
        """Initialize all ML models and services"""
        try:
            logger.info("🤖 Initializing ML services...")
            
            # Initialize computer vision service
            await self.cv_service.initialize()
            
            # Initialize AI service
            await self.ai_service.initialize()
            
            self.is_initialized = True
            logger.info("✅ All ML services initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Error initializing ML services: {e}")
            # Continue without ML services for basic functionality
            self.is_initialized = False
    
    async def detect_ingredients_from_image(
        self, 
        image_data: bytes, 
        user_id: str
    ) -> List[Dict[str, Any]]:
        """Detect ingredients from uploaded image"""
        if not self.is_initialized:
            logger.warning("ML services not initialized, using fallback")
            return []
        
        return await self.cv_service.detect_ingredients(image_data, user_id)
    
    async def generate_recipes(
        self,
        ingredients: List[str],
        user_preferences: Dict[str, Any],
        count: int = 3
    ) -> List[Dict[str, Any]]:
        """Generate recipes from ingredients"""
        if not self.is_initialized:
            logger.warning("AI service not initialized, using fallback")
            return self._get_fallback_recipes(ingredients, user_preferences, count)
        
        return await self.ai_service.generate_recipes_from_ingredients(
            ingredients, user_preferences, count
        )
    
    async def generate_budget_recipes(
        self,
        ingredients: List[str],
        user_preferences: Dict[str, Any],
        budget_limit: float,
        count: int = 3
    ) -> List[Dict[str, Any]]:
        """Generate budget-friendly recipes"""
        if not self.is_initialized:
            logger.warning("AI service not initialized, using fallback")
            return self._get_fallback_recipes(ingredients, user_preferences, count, budget_limit)
        
        return await self.ai_service.generate_budget_recipes(
            ingredients, user_preferences, budget_limit, count
        )
    
    def _get_fallback_recipes(
        self, 
        ingredients: List[str], 
        user_preferences: Dict[str, Any], 
        count: int = 3,
        budget_limit: float = None
    ) -> List[Dict[str, Any]]:
        """Fallback recipe generation when AI services are unavailable"""
        
        recipes = []
        for i in range(count):
            recipe = {
                "title": f"Simple {ingredients[0] if ingredients else 'Mixed'} Recipe {i+1}",
                "description": f"A delicious recipe using {', '.join(ingredients[:3])} and other ingredients.",
                "prep_time": 15 + (i * 5),
                "cook_time": 25 + (i * 10),
                "total_time": 40 + (i * 15),
                "servings": user_preferences.get('serving_size', 4),
                "difficulty_level": ["easy", "medium", "easy"][i % 3],
                "meal_type": ["lunch", "dinner", "breakfast"][i % 3],
                "cuisine_type": "international",
                "ingredients": [
                    {
                        "name": ingredient,
                        "quantity": 1 + (i * 0.5),
                        "unit": "cup",
                        "preparation": "chopped"
                    } for ingredient in ingredients[:5]
                ] + [
                    {"name": "salt", "quantity": 1, "unit": "tsp", "preparation": ""},
                    {"name": "pepper", "quantity": 0.5, "unit": "tsp", "preparation": ""},
                    {"name": "olive oil", "quantity": 2, "unit": "tbsp", "preparation": ""}
                ],
                "instructions": [
                    {
                        "step": 1,
                        "instruction": "Prepare all ingredients by washing and chopping as needed.",
                        "duration": 10,
                        "tips": "Make sure all ingredients are fresh and properly cleaned."
                    },
                    {
                        "step": 2,
                        "instruction": "Heat olive oil in a large pan over medium heat.",
                        "duration": 3,
                        "tips": "Don't let the oil smoke."
                    },
                    {
                        "step": 3,
                        "instruction": "Add ingredients and cook until tender and well combined.",
                        "duration": 20 + (i * 10),
                        "tips": "Stir occasionally to prevent sticking. Season to taste."
                    },
                    {
                        "step": 4,
                        "instruction": "Serve hot and enjoy!",
                        "duration": 2,
                        "tips": "Garnish with fresh herbs if available."
                    }
                ],
                "nutrition": {
                    "calories_per_serving": 280 + (i * 50),
                    "protein": 15 + (i * 5),
                    "carbs": 35 + (i * 10),
                    "fat": 8 + (i * 3),
                    "fiber": 4 + i,
                    "sugar": 6 + i,
                    "sodium": 450 + (i * 100)
                },
                "dietary_flags": {
                    "vegetarian": i < 2,
                    "vegan": i == 0,
                    "gluten_free": i == 1,
                    "dairy_free": i < 2,
                    "nut_free": True,
                    "low_carb": i == 2,
                    "keto": False
                },
                "tags": ["easy", "quick", "family-friendly", "budget-friendly"][:2+i],
                "tips": [
                    "This recipe is very flexible - feel free to substitute ingredients based on what you have.",
                    "Can be made ahead and reheated.",
                    "Stores well in the refrigerator for up to 3 days."
                ],
                "variations": [
                    "Add your favorite herbs and spices",
                    "Include additional vegetables for more nutrition",
                    "Serve over rice or pasta for a heartier meal"
                ],
                "storage_instructions": "Store in refrigerator for up to 3 days. Reheat gently before serving.",
                "estimated_cost": (budget_limit or 12.0) - (i * 2),
                "cost_per_serving": ((budget_limit or 12.0) - (i * 2)) / user_preferences.get('serving_size', 4),
                "is_budget_friendly": True,
                "ai_model_used": "fallback_generator",
                "generation_timestamp": "2024-01-01T00:00:00Z",
                "source_type": "fallback_generated",
                "quality_score": 75.0 - (i * 5)
            }
            recipes.append(recipe)
        
        return recipes


# Global ML service instance
ml_service = MLService()