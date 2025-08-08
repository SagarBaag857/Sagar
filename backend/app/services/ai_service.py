"""
AI Recipe Generation Service
Advanced recipe generation using OpenAI GPT-4 with nutrition analysis and budget optimization
"""

import json
import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import openai
from openai import AsyncOpenAI
import anthropic

from app.core.config import settings
from app.core.database import get_async_session
from app.models.recipe import Recipe, MealType, DifficultyLevel
from app.models.user import User, DietaryRestriction, CookingLevel
from app.models.ingredient import Ingredient
from app.services.nutrition_service import NutritionService

logger = logging.getLogger(__name__)


class RecipeGenerator:
    """
    Advanced AI-powered recipe generation with personalization
    """
    
    def __init__(self):
        self.openai_client = None
        self.anthropic_client = None
        self.nutrition_service = NutritionService()
        self.recipe_templates = {}
        
    async def initialize(self):
        """Initialize AI clients and services"""
        try:
            if settings.OPENAI_API_KEY:
                self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("✅ OpenAI client initialized")
            
            if settings.ANTHROPIC_API_KEY:
                self.anthropic_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
                logger.info("✅ Anthropic client initialized")
            
            await self.nutrition_service.initialize()
            self._load_recipe_templates()
            
            logger.info("✅ AI Recipe Generator initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Error initializing AI service: {e}")
            raise
    
    def _load_recipe_templates(self):
        """Load recipe generation templates"""
        self.recipe_templates = {
            "standard": {
                "system_prompt": """You are a professional chef and nutritionist AI assistant. Generate creative, delicious, and nutritionally balanced recipes based on the provided ingredients and user preferences. Always include:
1. Recipe title
2. Brief description
3. Prep time, cook time, and total time
4. Difficulty level
5. Detailed ingredient list with measurements
6. Step-by-step instructions
7. Nutritional information estimate
8. Tips and variations
9. Dietary restriction compatibility

Format your response as valid JSON with the specified structure.""",
                
                "user_prompt_template": """Create a {meal_type} recipe for {servings} people using these ingredients: {ingredients}

User Preferences:
- Cooking Level: {cooking_level}
- Dietary Restrictions: {dietary_restrictions}
- Allergies: {allergies}
- Cuisine Preference: {cuisine_preference}
- Max Cooking Time: {max_time} minutes
- Budget Mode: {budget_mode}

Additional Requirements:
- Make it {creativity_level} creative
- Focus on {focus_area}
- Avoid: {avoid_ingredients}

Please generate a complete recipe that's both delicious and practical."""
            },
            
            "budget": {
                "system_prompt": """You are a budget-conscious chef specializing in affordable, nutritious meals. Create recipes that maximize value while maintaining taste and nutrition. Focus on:
1. Using affordable, accessible ingredients
2. Minimizing food waste
3. Creating filling, satisfying meals
4. Providing cost-saving tips
5. Suggesting ingredient substitutions
6. Maximizing leftovers and meal prep potential

Always include estimated cost per serving and money-saving tips.""",
                
                "user_prompt_template": """Create a budget-friendly {meal_type} recipe for {servings} people with a target cost of ${budget} per serving.

Available Ingredients: {ingredients}
User Constraints: {dietary_restrictions}
Cooking Level: {cooking_level}
Max Time: {max_time} minutes

Focus on creating maximum value while ensuring the meal is nutritious and satisfying."""
            },
            
            "healthy": {
                "system_prompt": """You are a certified nutritionist and health-focused chef. Create recipes that prioritize nutritional density, balanced macronutrients, and health benefits. Focus on:
1. Maximizing nutrient density
2. Balancing macronutrients
3. Including superfoods and antioxidants
4. Minimizing processed ingredients
5. Optimizing for specific health goals
6. Providing detailed nutritional benefits

Always include comprehensive nutritional analysis and health benefits.""",
                
                "user_prompt_template": """Create a health-optimized {meal_type} recipe for {servings} people using these nutritious ingredients: {ingredients}

Health Goals: {health_goals}
Dietary Restrictions: {dietary_restrictions}
Nutrition Targets: {nutrition_targets}
Cooking Level: {cooking_level}

Prioritize nutrient density and health benefits while ensuring the recipe is delicious and satisfying."""
            }
        }
    
    async def generate_recipes(
        self,
        ingredients: List[str],
        user_preferences: Dict[str, Any],
        count: int = 3,
        recipe_type: str = "standard"
    ) -> List[Dict[str, Any]]:
        """
        Generate multiple recipe options based on ingredients and preferences
        
        Args:
            ingredients: List of available ingredients
            user_preferences: User preferences and dietary restrictions
            count: Number of recipes to generate
            recipe_type: Type of recipe generation (standard, budget, healthy)
            
        Returns:
            List of generated recipes with detailed information
        """
        try:
            recipes = []
            
            # Generate recipes using different approaches for variety
            for i in range(count):
                recipe_variation = await self._generate_single_recipe(
                    ingredients, 
                    user_preferences, 
                    recipe_type,
                    variation_index=i
                )
                
                if recipe_variation:
                    # Enhance with nutrition analysis
                    enhanced_recipe = await self._enhance_with_nutrition(recipe_variation)
                    
                    # Calculate cost if budget mode
                    if user_preferences.get('budget_mode', False):
                        enhanced_recipe = await self._calculate_recipe_cost(enhanced_recipe)
                    
                    recipes.append(enhanced_recipe)
            
            # Remove duplicates and rank by quality
            unique_recipes = self._deduplicate_recipes(recipes)
            ranked_recipes = await self._rank_recipes(unique_recipes, user_preferences)
            
            return ranked_recipes[:count]
            
        except Exception as e:
            logger.error(f"❌ Error generating recipes: {e}")
            return []
    
    async def _generate_single_recipe(
        self,
        ingredients: List[str],
        user_preferences: Dict[str, Any],
        recipe_type: str,
        variation_index: int = 0
    ) -> Optional[Dict[str, Any]]:
        """Generate a single recipe using AI"""
        try:
            template = self.recipe_templates.get(recipe_type, self.recipe_templates["standard"])
            
            # Prepare prompt variables
            prompt_vars = self._prepare_prompt_variables(
                ingredients, 
                user_preferences, 
                variation_index
            )
            
            # Format the prompt
            user_prompt = template["user_prompt_template"].format(**prompt_vars)
            
            # Add JSON schema for structured output
            json_schema = self._get_recipe_json_schema()
            
            # Generate recipe using OpenAI
            if self.openai_client:
                recipe = await self._generate_with_openai(
                    template["system_prompt"],
                    user_prompt,
                    json_schema
                )
            elif self.anthropic_client:
                recipe = await self._generate_with_anthropic(
                    template["system_prompt"],
                    user_prompt
                )
            else:
                # Fallback to mock generation for testing
                recipe = self._generate_mock_recipe(ingredients, user_preferences)
            
            return recipe
            
        except Exception as e:
            logger.error(f"❌ Error generating single recipe: {e}")
            return None
    
    def _prepare_prompt_variables(
        self,
        ingredients: List[str],
        user_preferences: Dict[str, Any],
        variation_index: int
    ) -> Dict[str, Any]:
        """Prepare variables for prompt formatting"""
        
        # Add variation to prompts for diversity
        creativity_levels = ["moderately", "very", "extremely"]
        focus_areas = ["flavor", "nutrition", "convenience", "presentation"]
        meal_types = ["breakfast", "lunch", "dinner", "snack"]
        
        return {
            "ingredients": ", ".join(ingredients),
            "servings": user_preferences.get('serving_size', 4),
            "meal_type": user_preferences.get('meal_type', meal_types[variation_index % len(meal_types)]),
            "cooking_level": user_preferences.get('cooking_level', 'intermediate'),
            "dietary_restrictions": ", ".join(user_preferences.get('dietary_restrictions', [])),
            "allergies": ", ".join(user_preferences.get('allergies', [])),
            "cuisine_preference": user_preferences.get('cuisine_preference', 'any'),
            "max_time": user_preferences.get('max_cooking_time', 60),
            "budget_mode": "Yes" if user_preferences.get('budget_mode', False) else "No",
            "budget": user_preferences.get('budget_per_meal', 15),
            "creativity_level": creativity_levels[variation_index % len(creativity_levels)],
            "focus_area": focus_areas[variation_index % len(focus_areas)],
            "avoid_ingredients": ", ".join(user_preferences.get('disliked_ingredients', [])),
            "health_goals": ", ".join(user_preferences.get('health_goals', [])),
            "nutrition_targets": user_preferences.get('nutrition_targets', {})
        }
    
    def _get_recipe_json_schema(self) -> Dict[str, Any]:
        """Get JSON schema for structured recipe output"""
        return {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "description": {"type": "string"},
                "prep_time": {"type": "integer"},
                "cook_time": {"type": "integer"},
                "total_time": {"type": "integer"},
                "servings": {"type": "integer"},
                "difficulty_level": {"type": "string", "enum": ["very_easy", "easy", "medium", "hard", "very_hard"]},
                "meal_type": {"type": "string", "enum": ["breakfast", "lunch", "dinner", "snack", "dessert"]},
                "cuisine_type": {"type": "string"},
                "ingredients": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "quantity": {"type": "number"},
                            "unit": {"type": "string"},
                            "preparation": {"type": "string"}
                        }
                    }
                },
                "instructions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "step": {"type": "integer"},
                            "instruction": {"type": "string"},
                            "duration": {"type": "integer"},
                            "tips": {"type": "string"}
                        }
                    }
                },
                "nutrition": {
                    "type": "object",
                    "properties": {
                        "calories_per_serving": {"type": "integer"},
                        "protein": {"type": "number"},
                        "carbs": {"type": "number"},
                        "fat": {"type": "number"},
                        "fiber": {"type": "number"},
                        "sugar": {"type": "number"},
                        "sodium": {"type": "number"}
                    }
                },
                "dietary_flags": {
                    "type": "object",
                    "properties": {
                        "vegetarian": {"type": "boolean"},
                        "vegan": {"type": "boolean"},
                        "gluten_free": {"type": "boolean"},
                        "dairy_free": {"type": "boolean"},
                        "nut_free": {"type": "boolean"},
                        "low_carb": {"type": "boolean"},
                        "keto": {"type": "boolean"}
                    }
                },
                "tags": {"type": "array", "items": {"type": "string"}},
                "tips": {"type": "array", "items": {"type": "string"}},
                "variations": {"type": "array", "items": {"type": "string"}},
                "storage_instructions": {"type": "string"},
                "estimated_cost": {"type": "number"}
            },
            "required": ["title", "description", "ingredients", "instructions", "nutrition"]
        }
    
    async def _generate_with_openai(
        self,
        system_prompt: str,
        user_prompt: str,
        json_schema: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate recipe using OpenAI GPT-4"""
        try:
            response = await self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt + "\n\nRespond with valid JSON following this schema:\n" + json.dumps(json_schema, indent=2)}
                ],
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=settings.OPENAI_TEMPERATURE,
                response_format={"type": "json_object"}
            )
            
            recipe_json = response.choices[0].message.content
            recipe = json.loads(recipe_json)
            
            # Add metadata
            recipe['ai_model_used'] = settings.OPENAI_MODEL
            recipe['generation_timestamp'] = datetime.utcnow().isoformat()
            recipe['source_type'] = 'ai_generated'
            
            return recipe
            
        except Exception as e:
            logger.error(f"❌ Error with OpenAI generation: {e}")
            raise
    
    async def _generate_with_anthropic(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> Dict[str, Any]:
        """Generate recipe using Anthropic Claude"""
        try:
            response = await self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=3000,
                temperature=settings.OPENAI_TEMPERATURE,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt + "\n\nRespond with valid JSON format."}
                ]
            )
            
            recipe_json = response.content[0].text
            # Extract JSON from response (Claude sometimes adds explanatory text)
            start_idx = recipe_json.find('{')
            end_idx = recipe_json.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                recipe_json = recipe_json[start_idx:end_idx]
            
            recipe = json.loads(recipe_json)
            
            # Add metadata
            recipe['ai_model_used'] = 'claude-3-sonnet'
            recipe['generation_timestamp'] = datetime.utcnow().isoformat()
            recipe['source_type'] = 'ai_generated'
            
            return recipe
            
        except Exception as e:
            logger.error(f"❌ Error with Anthropic generation: {e}")
            raise
    
    def _generate_mock_recipe(
        self,
        ingredients: List[str],
        user_preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate a mock recipe for testing when AI services are unavailable"""
        return {
            "title": f"Simple {ingredients[0] if ingredients else 'Mixed'} Recipe",
            "description": f"A delicious recipe using {', '.join(ingredients[:3])} and more.",
            "prep_time": 15,
            "cook_time": 30,
            "total_time": 45,
            "servings": user_preferences.get('serving_size', 4),
            "difficulty_level": "easy",
            "meal_type": "dinner",
            "cuisine_type": "fusion",
            "ingredients": [
                {
                    "name": ingredient,
                    "quantity": 1,
                    "unit": "cup",
                    "preparation": "chopped"
                } for ingredient in ingredients[:5]
            ],
            "instructions": [
                {
                    "step": 1,
                    "instruction": "Prepare all ingredients as specified.",
                    "duration": 10,
                    "tips": "Make sure ingredients are fresh."
                },
                {
                    "step": 2,
                    "instruction": "Combine ingredients and cook until done.",
                    "duration": 25,
                    "tips": "Adjust seasoning to taste."
                }
            ],
            "nutrition": {
                "calories_per_serving": 350,
                "protein": 20,
                "carbs": 45,
                "fat": 12,
                "fiber": 6,
                "sugar": 8,
                "sodium": 600
            },
            "dietary_flags": {
                "vegetarian": True,
                "vegan": False,
                "gluten_free": False,
                "dairy_free": False,
                "nut_free": True,
                "low_carb": False,
                "keto": False
            },
            "tags": ["easy", "quick", "family-friendly"],
            "tips": ["Season to taste", "Can be made ahead"],
            "variations": ["Add herbs for extra flavor"],
            "storage_instructions": "Store in refrigerator for up to 3 days",
            "estimated_cost": 8.50,
            "ai_model_used": "mock_generator",
            "generation_timestamp": datetime.utcnow().isoformat(),
            "source_type": "ai_generated"
        }
    
    async def _enhance_with_nutrition(self, recipe: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance recipe with detailed nutrition analysis"""
        try:
            if 'ingredients' in recipe:
                detailed_nutrition = await self.nutrition_service.analyze_recipe_nutrition(
                    recipe['ingredients']
                )
                
                # Update nutrition information
                recipe['nutrition'].update(detailed_nutrition)
                recipe['nutrition_analysis'] = detailed_nutrition
            
            return recipe
            
        except Exception as e:
            logger.warning(f"⚠️ Could not enhance nutrition: {e}")
            return recipe
    
    async def _calculate_recipe_cost(self, recipe: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate estimated cost for recipe"""
        try:
            total_cost = 0
            ingredient_costs = []
            
            for ingredient in recipe.get('ingredients', []):
                # In a real implementation, you'd have a cost database
                # For now, use estimated costs
                estimated_cost = self._estimate_ingredient_cost(
                    ingredient['name'],
                    ingredient.get('quantity', 1),
                    ingredient.get('unit', 'item')
                )
                
                total_cost += estimated_cost
                ingredient_costs.append({
                    'ingredient': ingredient['name'],
                    'cost': estimated_cost
                })
            
            cost_per_serving = total_cost / recipe.get('servings', 4)
            
            recipe['cost_analysis'] = {
                'total_cost': round(total_cost, 2),
                'cost_per_serving': round(cost_per_serving, 2),
                'ingredient_costs': ingredient_costs,
                'is_budget_friendly': cost_per_serving <= settings.BUDGET_MODE_PRICE_THRESHOLD
            }
            
            recipe['estimated_cost'] = total_cost
            recipe['cost_per_serving'] = cost_per_serving
            recipe['is_budget_friendly'] = cost_per_serving <= settings.BUDGET_MODE_PRICE_THRESHOLD
            
            return recipe
            
        except Exception as e:
            logger.warning(f"⚠️ Could not calculate cost: {e}")
            return recipe
    
    def _estimate_ingredient_cost(self, name: str, quantity: float, unit: str) -> float:
        """Estimate ingredient cost (placeholder implementation)"""
        # Basic cost estimates per unit
        cost_database = {
            'chicken': 3.00,  # per lb
            'beef': 6.00,     # per lb
            'pork': 4.00,     # per lb
            'fish': 8.00,     # per lb
            'rice': 2.00,     # per lb
            'pasta': 1.50,    # per lb
            'tomato': 2.00,   # per lb
            'onion': 1.00,    # per lb
            'garlic': 0.50,   # per bulb
            'potato': 1.50,   # per lb
            'carrot': 1.25,   # per lb
            'broccoli': 2.50, # per lb
            'apple': 2.00,    # per lb
            'banana': 1.00,   # per lb
            'milk': 3.50,     # per gallon
            'eggs': 2.50,     # per dozen
            'cheese': 4.00,   # per lb
            'bread': 2.00,    # per loaf
            'butter': 4.00,   # per lb
            'oil': 3.00,      # per bottle
        }
        
        base_cost = cost_database.get(name.lower(), 2.00)  # Default $2.00
        
        # Simple quantity conversion (needs improvement for real implementation)
        unit_multiplier = {
            'cup': 0.25,
            'tbsp': 0.05,
            'tsp': 0.02,
            'oz': 0.06,
            'lb': 1.0,
            'item': 1.0,
            'clove': 0.1,
            'slice': 0.1
        }
        
        multiplier = unit_multiplier.get(unit.lower(), 0.25)
        return base_cost * quantity * multiplier
    
    def _deduplicate_recipes(self, recipes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate recipes based on similarity"""
        unique_recipes = []
        
        for recipe in recipes:
            is_duplicate = False
            for existing in unique_recipes:
                if self._calculate_recipe_similarity(recipe, existing) > 0.8:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_recipes.append(recipe)
        
        return unique_recipes
    
    def _calculate_recipe_similarity(self, recipe1: Dict[str, Any], recipe2: Dict[str, Any]) -> float:
        """Calculate similarity between two recipes"""
        # Simple similarity based on title and main ingredients
        title_similarity = self._text_similarity(
            recipe1.get('title', ''),
            recipe2.get('title', '')
        )
        
        ingredients1 = {ing['name'].lower() for ing in recipe1.get('ingredients', [])}
        ingredients2 = {ing['name'].lower() for ing in recipe2.get('ingredients', [])}
        
        if not ingredients1 or not ingredients2:
            return title_similarity
        
        ingredient_similarity = len(ingredients1 & ingredients2) / len(ingredients1 | ingredients2)
        
        return (title_similarity + ingredient_similarity) / 2
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """Calculate text similarity using simple word overlap"""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        return len(words1 & words2) / len(words1 | words2)
    
    async def _rank_recipes(
        self,
        recipes: List[Dict[str, Any]],
        user_preferences: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Rank recipes based on user preferences and quality metrics"""
        scored_recipes = []
        
        for recipe in recipes:
            score = await self._calculate_recipe_score(recipe, user_preferences)
            recipe['quality_score'] = score
            scored_recipes.append(recipe)
        
        # Sort by score descending
        scored_recipes.sort(key=lambda x: x['quality_score'], reverse=True)
        
        return scored_recipes
    
    async def _calculate_recipe_score(
        self,
        recipe: Dict[str, Any],
        user_preferences: Dict[str, Any]
    ) -> float:
        """Calculate quality score for recipe based on user preferences"""
        score = 0.0
        
        # Time preference scoring
        max_time = user_preferences.get('max_cooking_time', 60)
        recipe_time = recipe.get('total_time', 45)
        if recipe_time <= max_time:
            score += 20
        else:
            score += max(0, 20 - (recipe_time - max_time) / 10)
        
        # Difficulty preference scoring
        user_cooking_level = user_preferences.get('cooking_level', 'intermediate')
        difficulty_scores = {
            'beginner': {'very_easy': 20, 'easy': 15, 'medium': 5, 'hard': 0, 'very_hard': 0},
            'intermediate': {'very_easy': 15, 'easy': 20, 'medium': 20, 'hard': 10, 'very_hard': 0},
            'advanced': {'very_easy': 10, 'easy': 15, 'medium': 20, 'hard': 20, 'very_hard': 15},
            'professional': {'very_easy': 5, 'easy': 10, 'medium': 15, 'hard': 20, 'very_hard': 20}
        }
        
        recipe_difficulty = recipe.get('difficulty_level', 'medium')
        score += difficulty_scores.get(user_cooking_level, {}).get(recipe_difficulty, 10)
        
        # Dietary restrictions compliance
        dietary_restrictions = user_preferences.get('dietary_restrictions', [])
        dietary_flags = recipe.get('dietary_flags', {})
        
        compliance = 0
        for restriction in dietary_restrictions:
            if dietary_flags.get(restriction, False):
                compliance += 1
        
        if dietary_restrictions:
            score += (compliance / len(dietary_restrictions)) * 20
        else:
            score += 10  # Base score if no restrictions
        
        # Budget compliance
        if user_preferences.get('budget_mode', False):
            budget_limit = user_preferences.get('budget_per_meal', 15)
            recipe_cost = recipe.get('cost_per_serving', 10)
            if recipe_cost <= budget_limit:
                score += 15
            else:
                score += max(0, 15 - (recipe_cost - budget_limit))
        
        # Nutrition scoring (placeholder)
        nutrition = recipe.get('nutrition', {})
        if nutrition.get('calories_per_serving', 0) < 800:  # Reasonable calorie count
            score += 10
        
        # Ingredient availability (if all ingredients are provided)
        # This would need ingredient matching logic
        score += 15  # Assume good availability for now
        
        return min(score, 100)  # Cap at 100


class AIService:
    """AI Service wrapper for recipe generation"""
    
    def __init__(self):
        self.recipe_generator = RecipeGenerator()
    
    async def initialize(self):
        """Initialize the AI service"""
        await self.recipe_generator.initialize()
    
    async def generate_recipes_from_ingredients(
        self,
        ingredients: List[str],
        user_preferences: Dict[str, Any],
        count: int = 3
    ) -> List[Dict[str, Any]]:
        """Generate recipes from ingredients"""
        return await self.recipe_generator.generate_recipes(
            ingredients, 
            user_preferences, 
            count
        )
    
    async def generate_budget_recipes(
        self,
        ingredients: List[str],
        user_preferences: Dict[str, Any],
        budget_limit: float,
        count: int = 3
    ) -> List[Dict[str, Any]]:
        """Generate budget-friendly recipes"""
        user_preferences['budget_mode'] = True
        user_preferences['budget_per_meal'] = budget_limit
        
        return await self.recipe_generator.generate_recipes(
            ingredients,
            user_preferences,
            count,
            recipe_type="budget"
        )


# Global AI service instance
ai_service = AIService()