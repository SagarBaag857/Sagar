"""
Nutrition Analysis Service
Provides detailed nutritional analysis for recipes and ingredients
"""

import logging
from typing import List, Dict, Any, Optional
import asyncio

logger = logging.getLogger(__name__)


class NutritionService:
    """Service for nutritional analysis"""
    
    def __init__(self):
        self.nutrition_database = {}
    
    async def initialize(self):
        """Initialize nutrition service"""
        self._load_nutrition_database()
        logger.info("✅ Nutrition service initialized")
    
    def _load_nutrition_database(self):
        """Load basic nutrition database"""
        # Simplified nutrition data per 100g
        self.nutrition_database = {
            'chicken': {'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6, 'fiber': 0},
            'beef': {'calories': 250, 'protein': 26, 'carbs': 0, 'fat': 15, 'fiber': 0},
            'fish': {'calories': 206, 'protein': 22, 'carbs': 0, 'fat': 12, 'fiber': 0},
            'rice': {'calories': 130, 'protein': 2.7, 'carbs': 28, 'fat': 0.3, 'fiber': 0.4},
            'pasta': {'calories': 131, 'protein': 5, 'carbs': 25, 'fat': 1.1, 'fiber': 1.8},
            'tomato': {'calories': 18, 'protein': 0.9, 'carbs': 3.9, 'fat': 0.2, 'fiber': 1.2},
            'onion': {'calories': 40, 'protein': 1.1, 'carbs': 9.3, 'fat': 0.1, 'fiber': 1.7},
            'carrot': {'calories': 41, 'protein': 0.9, 'carbs': 9.6, 'fat': 0.2, 'fiber': 2.8},
            'potato': {'calories': 77, 'protein': 2, 'carbs': 17, 'fat': 0.1, 'fiber': 2.2},
            'apple': {'calories': 52, 'protein': 0.3, 'carbs': 14, 'fat': 0.2, 'fiber': 2.4},
            'banana': {'calories': 89, 'protein': 1.1, 'carbs': 23, 'fat': 0.3, 'fiber': 2.6},
            'broccoli': {'calories': 34, 'protein': 2.8, 'carbs': 7, 'fat': 0.4, 'fiber': 2.6},
            'cheese': {'calories': 402, 'protein': 25, 'carbs': 1.3, 'fat': 33, 'fiber': 0},
            'milk': {'calories': 42, 'protein': 3.4, 'carbs': 5, 'fat': 1, 'fiber': 0},
            'egg': {'calories': 155, 'protein': 13, 'carbs': 1.1, 'fat': 11, 'fiber': 0},
            'bread': {'calories': 265, 'protein': 9, 'carbs': 49, 'fat': 3.2, 'fiber': 2.7},
        }
    
    async def analyze_recipe_nutrition(self, ingredients: List[Dict[str, Any]]) -> Dict[str, float]:
        """Analyze nutrition for a recipe"""
        try:
            total_nutrition = {
                'calories': 0,
                'protein': 0,
                'carbs': 0,
                'fat': 0,
                'fiber': 0,
                'sugar': 0,
                'sodium': 0
            }
            
            for ingredient in ingredients:
                name = ingredient.get('name', '').lower()
                quantity = ingredient.get('quantity', 1)
                unit = ingredient.get('unit', 'cup')
                
                # Convert to grams (simplified)
                grams = self._convert_to_grams(quantity, unit, name)
                
                # Get nutrition per 100g
                nutrition_per_100g = self.nutrition_database.get(name, {
                    'calories': 50, 'protein': 2, 'carbs': 10, 'fat': 1, 'fiber': 1
                })
                
                # Calculate nutrition for this ingredient
                multiplier = grams / 100
                for nutrient in total_nutrition:
                    if nutrient in nutrition_per_100g:
                        total_nutrition[nutrient] += nutrition_per_100g[nutrient] * multiplier
            
            return total_nutrition
            
        except Exception as e:
            logger.warning(f"⚠️ Error analyzing nutrition: {e}")
            return {
                'calories': 350, 'protein': 20, 'carbs': 45, 'fat': 12, 
                'fiber': 6, 'sugar': 8, 'sodium': 600
            }
    
    def _convert_to_grams(self, quantity: float, unit: str, ingredient: str) -> float:
        """Convert quantity to grams (simplified conversion)"""
        conversions = {
            'cup': 240,  # ml, rough average
            'tbsp': 15,
            'tsp': 5,
            'oz': 28,
            'lb': 454,
            'g': 1,
            'kg': 1000,
            'ml': 1,
            'l': 1000,
            'item': 150,  # average item weight
            'clove': 3,   # garlic clove
            'slice': 25,  # bread slice
        }
        
        # Density adjustments for different ingredients
        density_adjustments = {
            'rice': 0.75,
            'flour': 0.6,
            'sugar': 0.85,
            'milk': 1.03,
            'oil': 0.92
        }
        
        base_grams = quantity * conversions.get(unit.lower(), 100)
        density = density_adjustments.get(ingredient.lower(), 1.0)
        
        return base_grams * density