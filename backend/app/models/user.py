"""
User Model
Comprehensive user management with authentication, preferences, and dietary restrictions
"""

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, 
    JSON, Float, Enum as SQLEnum, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
import enum
from datetime import datetime
from typing import Dict, List, Optional, Any

from app.core.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration"""
    USER = "user"
    PREMIUM = "premium"
    ADMIN = "admin"
    MODERATOR = "moderator"


class DietaryRestriction(str, enum.Enum):
    """Dietary restriction enumeration"""
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    GLUTEN_FREE = "gluten_free"
    DAIRY_FREE = "dairy_free"
    NUT_FREE = "nut_free"
    LOW_CARB = "low_carb"
    KETO = "keto"
    PALEO = "paleo"
    HALAL = "halal"
    KOSHER = "kosher"
    LOW_SODIUM = "low_sodium"
    DIABETIC = "diabetic"


class CookingLevel(str, enum.Enum):
    """Cooking skill level enumeration"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    PROFESSIONAL = "professional"


class User(Base):
    """
    User model with comprehensive profile management
    """
    __tablename__ = "users"

    # Primary identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    
    # Authentication
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String(255), nullable=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    
    # Profile information
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    display_name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    
    # Location and preferences
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    timezone = Column(String(50), default="UTC")
    language = Column(String(10), default="en")
    currency = Column(String(3), default="USD")
    
    # Account management
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    last_login = Column(DateTime, nullable=True)
    login_count = Column(Integer, default=0)
    
    # Subscription and premium features
    is_premium = Column(Boolean, default=False)
    premium_expires = Column(DateTime, nullable=True)
    subscription_id = Column(String(255), nullable=True)
    
    # Cooking preferences
    cooking_level = Column(SQLEnum(CookingLevel), default=CookingLevel.BEGINNER)
    dietary_restrictions = Column(ARRAY(String), default=list)
    allergies = Column(ARRAY(String), default=list)
    favorite_cuisines = Column(ARRAY(String), default=list)
    disliked_ingredients = Column(ARRAY(String), default=list)
    
    # Nutrition goals
    daily_calorie_goal = Column(Integer, nullable=True)
    protein_goal = Column(Float, nullable=True)
    carb_goal = Column(Float, nullable=True)
    fat_goal = Column(Float, nullable=True)
    fiber_goal = Column(Float, nullable=True)
    
    # Recipe preferences
    preferred_meal_types = Column(ARRAY(String), default=list)  # breakfast, lunch, dinner, snack
    max_cooking_time = Column(Integer, default=60)  # minutes
    budget_per_meal = Column(Float, nullable=True)
    serving_size_preference = Column(Integer, default=4)
    
    # AI and personalization
    ai_creativity_level = Column(Float, default=0.7)  # 0.0 to 1.0
    enable_ai_suggestions = Column(Boolean, default=True)
    enable_notifications = Column(Boolean, default=True)
    enable_email_notifications = Column(Boolean, default=True)
    
    # Privacy settings
    profile_visibility = Column(String(20), default="public")  # public, friends, private
    recipe_sharing_default = Column(String(20), default="public")
    show_nutrition_publicly = Column(Boolean, default=True)
    
    # Tracking and analytics
    total_recipes_generated = Column(Integer, default=0)
    total_recipes_cooked = Column(Integer, default=0)
    total_photos_uploaded = Column(Integer, default=0)
    favorite_recipe_count = Column(Integer, default=0)
    
    # Social features
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    recipe_likes_received = Column(Integer, default=0)
    
    # Device and session management
    device_tokens = Column(JSON, default=dict)  # For push notifications
    session_data = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    last_activity = Column(DateTime, default=func.now())
    
    # Relationships
    recipes = relationship("Recipe", back_populates="author", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    shopping_lists = relationship("ShoppingList", back_populates="user", cascade="all, delete-orphan")
    ingredient_detections = relationship("IngredientDetection", back_populates="user")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"
    
    @property
    def full_name(self) -> str:
        """Get user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.display_name or self.username
    
    @property
    def is_premium_active(self) -> bool:
        """Check if premium subscription is active"""
        if not self.is_premium:
            return False
        if self.premium_expires is None:
            return True
        return datetime.utcnow() < self.premium_expires
    
    def has_dietary_restriction(self, restriction: str) -> bool:
        """Check if user has specific dietary restriction"""
        return restriction in (self.dietary_restrictions or [])
    
    def has_allergy(self, allergen: str) -> bool:
        """Check if user has specific allergy"""
        return allergen in (self.allergies or [])
    
    def add_dietary_restriction(self, restriction: str) -> None:
        """Add dietary restriction"""
        if self.dietary_restrictions is None:
            self.dietary_restrictions = []
        if restriction not in self.dietary_restrictions:
            self.dietary_restrictions.append(restriction)
    
    def remove_dietary_restriction(self, restriction: str) -> None:
        """Remove dietary restriction"""
        if self.dietary_restrictions and restriction in self.dietary_restrictions:
            self.dietary_restrictions.remove(restriction)
    
    def add_allergy(self, allergen: str) -> None:
        """Add allergy"""
        if self.allergies is None:
            self.allergies = []
        if allergen not in self.allergies:
            self.allergies.append(allergen)
    
    def remove_allergy(self, allergen: str) -> None:
        """Remove allergy"""
        if self.allergies and allergen in self.allergies:
            self.allergies.remove(allergen)
    
    def get_preferences_dict(self) -> Dict[str, Any]:
        """Get user preferences as dictionary"""
        return {
            "cooking_level": self.cooking_level,
            "dietary_restrictions": self.dietary_restrictions or [],
            "allergies": self.allergies or [],
            "favorite_cuisines": self.favorite_cuisines or [],
            "disliked_ingredients": self.disliked_ingredients or [],
            "max_cooking_time": self.max_cooking_time,
            "budget_per_meal": self.budget_per_meal,
            "serving_size_preference": self.serving_size_preference,
            "ai_creativity_level": self.ai_creativity_level,
            "daily_calorie_goal": self.daily_calorie_goal,
            "protein_goal": self.protein_goal,
            "carb_goal": self.carb_goal,
            "fat_goal": self.fat_goal,
            "fiber_goal": self.fiber_goal,
        }
    
    def update_activity(self) -> None:
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()
    
    def increment_recipe_count(self) -> None:
        """Increment total recipes generated"""
        self.total_recipes_generated += 1
    
    def increment_cooked_count(self) -> None:
        """Increment total recipes cooked"""
        self.total_recipes_cooked += 1
    
    def increment_photo_count(self) -> None:
        """Increment total photos uploaded"""
        self.total_photos_uploaded += 1


class UserSession(Base):
    """
    User session tracking for security and analytics
    """
    __tablename__ = "user_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_token = Column(String(255), unique=True, nullable=False, index=True)
    
    # Session details
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    device_type = Column(String(50), nullable=True)
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)
    
    # Location (if available)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    
    # Session management
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=False)
    last_activity = Column(DateTime, default=func.now())
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User")
    
    def __repr__(self) -> str:
        return f"<UserSession(id={self.id}, user_id={self.user_id}, active={self.is_active})>"
    
    @property
    def is_expired(self) -> bool:
        """Check if session is expired"""
        return datetime.utcnow() > self.expires_at
    
    def extend_session(self, hours: int = 24) -> None:
        """Extend session expiry"""
        from datetime import timedelta
        self.expires_at = datetime.utcnow() + timedelta(hours=hours)
        self.last_activity = datetime.utcnow()


class UserPreference(Base):
    """
    Additional user preferences that can be extended
    """
    __tablename__ = "user_preferences"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Preference key-value pairs
    preference_key = Column(String(100), nullable=False)
    preference_value = Column(JSON, nullable=True)
    
    # Metadata
    category = Column(String(50), nullable=True)  # e.g., "cooking", "nutrition", "ui"
    description = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    
    def __repr__(self) -> str:
        return f"<UserPreference(user_id={self.user_id}, key={self.preference_key})>"