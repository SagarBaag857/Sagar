# Import all models to ensure they are registered with SQLAlchemy
from .user import User, UserSession, UserPreference, UserRole, DietaryRestriction, CookingLevel
from .recipe import Recipe, RecipeIngredient, Tag, RecipeStep, MealType, DifficultyLevel, RecipeStatus
from .ingredient import Ingredient, IngredientCategory, IngredientDetection, NutritionInfo
from .nutrition import NutritionAnalysis, NutrientType
from .review import Review, ReviewStatus
from .favorite import Favorite
from .shopping_list import ShoppingList, ShoppingListItem

__all__ = [
    # User models
    "User",
    "UserSession", 
    "UserPreference",
    "UserRole",
    "DietaryRestriction",
    "CookingLevel",
    
    # Recipe models
    "Recipe",
    "RecipeIngredient",
    "Tag",
    "RecipeStep",
    "MealType",
    "DifficultyLevel",
    "RecipeStatus",
    
    # Ingredient models
    "Ingredient",
    "IngredientCategory",
    "IngredientDetection",
    "NutritionInfo",
    
    # Nutrition models
    "NutritionAnalysis",
    "NutrientType",
    
    # Review models
    "Review",
    "ReviewStatus",
    
    # Favorite models
    "Favorite",
    
    # Shopping list models
    "ShoppingList",
    "ShoppingListItem",
]