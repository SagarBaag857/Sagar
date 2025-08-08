"""
Recipe Model
Comprehensive recipe management with ingredients, instructions, nutrition, and social features
"""

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, 
    JSON, Float, Enum as SQLEnum, ForeignKey, Table
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
import enum
from datetime import datetime
from typing import Dict, List, Optional, Any

from app.core.database import Base


class MealType(str, enum.Enum):
    """Meal type enumeration"""
    BREAKFAST = "breakfast"
    BRUNCH = "brunch"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"
    DESSERT = "dessert"
    APPETIZER = "appetizer"
    BEVERAGE = "beverage"


class DifficultyLevel(str, enum.Enum):
    """Recipe difficulty level"""
    VERY_EASY = "very_easy"
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    VERY_HARD = "very_hard"


class RecipeStatus(str, enum.Enum):
    """Recipe status enumeration"""
    DRAFT = "draft"
    PUBLISHED = "published"
    PRIVATE = "private"
    ARCHIVED = "archived"
    FLAGGED = "flagged"


# Association table for recipe tags
recipe_tags = Table(
    'recipe_tags',
    Base.metadata,
    Column('recipe_id', UUID(as_uuid=True), ForeignKey('recipes.id'), primary_key=True),
    Column('tag_id', UUID(as_uuid=True), ForeignKey('tags.id'), primary_key=True)
)


class Recipe(Base):
    """
    Recipe model with comprehensive recipe information
    """
    __tablename__ = "recipes"

    # Primary identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(200), nullable=False, index=True)
    slug = Column(String(250), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Author and visibility
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(SQLEnum(RecipeStatus), default=RecipeStatus.PUBLISHED, nullable=False)
    visibility = Column(String(20), default="public")  # public, private, friends
    
    # Recipe classification
    meal_type = Column(SQLEnum(MealType), nullable=True)
    cuisine_type = Column(String(50), nullable=True)  # italian, mexican, asian, etc.
    difficulty_level = Column(SQLEnum(DifficultyLevel), default=DifficultyLevel.MEDIUM)
    
    # Timing and servings
    prep_time = Column(Integer, nullable=True)  # minutes
    cook_time = Column(Integer, nullable=True)  # minutes
    total_time = Column(Integer, nullable=True)  # minutes
    servings = Column(Integer, default=4, nullable=False)
    
    # Instructions and ingredients
    instructions = Column(JSON, nullable=False)  # List of step objects
    ingredients_list = Column(JSON, nullable=False)  # List of ingredient objects
    equipment_needed = Column(ARRAY(String), default=list)
    
    # Media
    main_image_url = Column(String(500), nullable=True)
    images = Column(JSON, default=list)  # List of image URLs
    video_url = Column(String(500), nullable=True)
    
    # Nutrition information
    calories_per_serving = Column(Integer, nullable=True)
    protein_per_serving = Column(Float, nullable=True)
    carbs_per_serving = Column(Float, nullable=True)
    fat_per_serving = Column(Float, nullable=True)
    fiber_per_serving = Column(Float, nullable=True)
    sugar_per_serving = Column(Float, nullable=True)
    sodium_per_serving = Column(Float, nullable=True)
    
    # Cost and budget information
    estimated_cost = Column(Float, nullable=True)
    cost_per_serving = Column(Float, nullable=True)
    currency = Column(String(3), default="USD")
    is_budget_friendly = Column(Boolean, default=False)
    
    # Dietary information
    is_vegetarian = Column(Boolean, default=False)
    is_vegan = Column(Boolean, default=False)
    is_gluten_free = Column(Boolean, default=False)
    is_dairy_free = Column(Boolean, default=False)
    is_nut_free = Column(Boolean, default=False)
    is_low_carb = Column(Boolean, default=False)
    is_keto = Column(Boolean, default=False)
    is_paleo = Column(Boolean, default=False)
    is_halal = Column(Boolean, default=False)
    is_kosher = Column(Boolean, default=False)
    
    # Recipe source and generation
    source_type = Column(String(20), default="ai_generated")  # ai_generated, user_created, imported
    source_url = Column(String(500), nullable=True)
    ai_model_used = Column(String(50), nullable=True)
    generation_prompt = Column(Text, nullable=True)
    
    # Social and engagement
    likes_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    favorites_count = Column(Integer, default=0)
    cooked_count = Column(Integer, default=0)  # How many times it was cooked
    
    # Recipe rating
    average_rating = Column(Float, default=0.0)
    ratings_count = Column(Integer, default=0)
    
    # SEO and searchability
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    keywords = Column(ARRAY(String), default=list)
    
    # Recipe variants and alternatives
    parent_recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.id"), nullable=True)
    variant_type = Column(String(50), nullable=True)  # low_calorie, gluten_free, etc.
    
    # Seasonal and special occasions
    seasonal_tags = Column(ARRAY(String), default=list)  # spring, summer, fall, winter
    occasion_tags = Column(ARRAY(String), default=list)  # birthday, christmas, etc.
    
    # Recipe feedback and improvements
    feedback_summary = Column(JSON, default=dict)
    improvement_suggestions = Column(JSON, default=list)
    
    # Analytics and tracking
    performance_score = Column(Float, default=0.0)  # Overall recipe performance
    engagement_rate = Column(Float, default=0.0)
    conversion_rate = Column(Float, default=0.0)  # Views to cooked ratio
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    published_at = Column(DateTime, nullable=True)
    last_cooked_at = Column(DateTime, nullable=True)
    
    # Relationships
    author = relationship("User", back_populates="recipes")
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="recipe", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="recipe", cascade="all, delete-orphan")
    variations = relationship("Recipe", remote_side=[id])
    tags = relationship("Tag", secondary=recipe_tags, back_populates="recipes")
    nutrition_analysis = relationship("NutritionAnalysis", back_populates="recipe", uselist=False)
    
    def __repr__(self) -> str:
        return f"<Recipe(id={self.id}, title={self.title}, author_id={self.author_id})>"
    
    @property
    def total_time_minutes(self) -> int:
        """Calculate total time from prep and cook time"""
        if self.total_time:
            return self.total_time
        prep = self.prep_time or 0
        cook = self.cook_time or 0
        return prep + cook
    
    @property
    def difficulty_score(self) -> int:
        """Get numeric difficulty score"""
        difficulty_scores = {
            DifficultyLevel.VERY_EASY: 1,
            DifficultyLevel.EASY: 2,
            DifficultyLevel.MEDIUM: 3,
            DifficultyLevel.HARD: 4,
            DifficultyLevel.VERY_HARD: 5
        }
        return difficulty_scores.get(self.difficulty_level, 3)
    
    def calculate_nutrition_per_serving(self) -> Dict[str, float]:
        """Calculate nutrition values per serving"""
        return {
            "calories": self.calories_per_serving or 0,
            "protein": self.protein_per_serving or 0,
            "carbs": self.carbs_per_serving or 0,
            "fat": self.fat_per_serving or 0,
            "fiber": self.fiber_per_serving or 0,
            "sugar": self.sugar_per_serving or 0,
            "sodium": self.sodium_per_serving or 0,
        }
    
    def get_dietary_flags(self) -> List[str]:
        """Get list of dietary restriction flags"""
        flags = []
        if self.is_vegetarian: flags.append("vegetarian")
        if self.is_vegan: flags.append("vegan")
        if self.is_gluten_free: flags.append("gluten_free")
        if self.is_dairy_free: flags.append("dairy_free")
        if self.is_nut_free: flags.append("nut_free")
        if self.is_low_carb: flags.append("low_carb")
        if self.is_keto: flags.append("keto")
        if self.is_paleo: flags.append("paleo")
        if self.is_halal: flags.append("halal")
        if self.is_kosher: flags.append("kosher")
        return flags
    
    def increment_view_count(self) -> None:
        """Increment view count"""
        self.views_count += 1
    
    def increment_like_count(self) -> None:
        """Increment like count"""
        self.likes_count += 1
    
    def decrement_like_count(self) -> None:
        """Decrement like count"""
        if self.likes_count > 0:
            self.likes_count -= 1
    
    def increment_cooked_count(self) -> None:
        """Increment cooked count"""
        self.cooked_count += 1
        self.last_cooked_at = datetime.utcnow()
    
    def update_rating(self, new_rating: float) -> None:
        """Update average rating with new rating"""
        if self.ratings_count == 0:
            self.average_rating = new_rating
            self.ratings_count = 1
        else:
            total_rating = self.average_rating * self.ratings_count
            self.ratings_count += 1
            self.average_rating = (total_rating + new_rating) / self.ratings_count
    
    def calculate_performance_score(self) -> float:
        """Calculate overall recipe performance score"""
        # Weighted scoring based on various metrics
        weights = {
            "rating": 0.3,
            "engagement": 0.25,
            "conversion": 0.2,
            "popularity": 0.15,
            "freshness": 0.1
        }
        
        # Rating score (0-1)
        rating_score = (self.average_rating / 5.0) if self.ratings_count > 0 else 0
        
        # Engagement score (likes + favorites per view)
        engagement_score = 0
        if self.views_count > 0:
            engagement_score = min((self.likes_count + self.favorites_count) / self.views_count, 1.0)
        
        # Conversion score (cooked per view)
        conversion_score = 0
        if self.views_count > 0:
            conversion_score = min(self.cooked_count / self.views_count, 1.0)
        
        # Popularity score (based on total interactions)
        total_interactions = self.likes_count + self.favorites_count + self.cooked_count
        popularity_score = min(total_interactions / 100.0, 1.0)  # Normalize to 100 interactions
        
        # Freshness score (newer recipes get higher scores)
        days_since_creation = (datetime.utcnow() - self.created_at).days
        freshness_score = max(1.0 - (days_since_creation / 365.0), 0)  # Decay over a year
        
        # Calculate weighted score
        score = (
            weights["rating"] * rating_score +
            weights["engagement"] * engagement_score +
            weights["conversion"] * conversion_score +
            weights["popularity"] * popularity_score +
            weights["freshness"] * freshness_score
        )
        
        self.performance_score = score
        return score


class RecipeIngredient(Base):
    """
    Association table for recipe ingredients with quantities
    """
    __tablename__ = "recipe_ingredients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.id"), nullable=False)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=False)
    
    # Quantity and measurement
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)  # cup, tbsp, oz, g, etc.
    preparation = Column(String(100), nullable=True)  # diced, minced, etc.
    
    # Additional properties
    is_optional = Column(Boolean, default=False)
    substitutes = Column(ARRAY(String), default=list)
    notes = Column(Text, nullable=True)
    
    # Order in the recipe
    order_index = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="recipe_ingredients")
    
    def __repr__(self) -> str:
        return f"<RecipeIngredient(recipe_id={self.recipe_id}, ingredient_id={self.ingredient_id})>"
    
    @property
    def display_text(self) -> str:
        """Get formatted ingredient text for display"""
        text = f"{self.quantity} {self.unit}"
        if self.ingredient:
            text += f" {self.ingredient.name}"
        if self.preparation:
            text += f", {self.preparation}"
        if self.is_optional:
            text += " (optional)"
        return text


class Tag(Base):
    """
    Tags for categorizing recipes
    """
    __tablename__ = "tags"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)  # cuisine, dietary, occasion, etc.
    color = Column(String(7), nullable=True)  # Hex color code
    
    # Usage statistics
    usage_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    recipes = relationship("Recipe", secondary=recipe_tags, back_populates="tags")
    
    def __repr__(self) -> str:
        return f"<Tag(id={self.id}, name={self.name})>"
    
    def increment_usage(self) -> None:
        """Increment usage count"""
        self.usage_count += 1


class RecipeStep(Base):
    """
    Individual recipe steps for detailed instructions
    """
    __tablename__ = "recipe_steps"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.id"), nullable=False)
    
    # Step details
    step_number = Column(Integer, nullable=False)
    title = Column(String(200), nullable=True)
    instruction = Column(Text, nullable=False)
    
    # Timing and temperature
    duration = Column(Integer, nullable=True)  # minutes
    temperature = Column(Integer, nullable=True)  # degrees
    temperature_unit = Column(String(1), default="F")  # F or C
    
    # Media
    image_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    
    # Additional information
    tips = Column(Text, nullable=True)
    warnings = Column(Text, nullable=True)
    equipment = Column(ARRAY(String), default=list)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    recipe = relationship("Recipe")
    
    def __repr__(self) -> str:
        return f"<RecipeStep(recipe_id={self.recipe_id}, step={self.step_number})>"