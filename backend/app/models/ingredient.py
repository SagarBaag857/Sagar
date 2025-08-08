"""
Ingredient Model
Comprehensive ingredient management with categories, nutrition info, and detection
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
import enum
from datetime import datetime
from typing import Dict, List, Optional, Any

from app.core.database import Base


class IngredientCategory(Base):
    """Ingredient categories for organization"""
    __tablename__ = "ingredient_categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    parent_category_id = Column(UUID(as_uuid=True), ForeignKey("ingredient_categories.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    ingredients = relationship("Ingredient", back_populates="category")
    parent_category = relationship("IngredientCategory", remote_side=[id])
    subcategories = relationship("IngredientCategory")


class Ingredient(Base):
    """Ingredient model with comprehensive nutritional and detection information"""
    __tablename__ = "ingredients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(200), nullable=False, index=True)
    common_names = Column(ARRAY(String), default=list)
    category_id = Column(UUID(as_uuid=True), ForeignKey("ingredient_categories.id"), nullable=True)
    
    # Basic properties
    description = Column(Text, nullable=True)
    storage_instructions = Column(Text, nullable=True)
    shelf_life_days = Column(Integer, nullable=True)
    
    # Nutritional information per 100g
    calories_per_100g = Column(Float, nullable=True)
    protein_per_100g = Column(Float, nullable=True)
    carbs_per_100g = Column(Float, nullable=True)
    fat_per_100g = Column(Float, nullable=True)
    fiber_per_100g = Column(Float, nullable=True)
    sugar_per_100g = Column(Float, nullable=True)
    sodium_per_100g = Column(Float, nullable=True)
    
    # Cost information
    average_cost_per_unit = Column(Float, nullable=True)
    cost_unit = Column(String(20), nullable=True)  # per lb, per kg, per item
    
    # Seasonal availability
    seasonal_availability = Column(ARRAY(String), default=list)  # spring, summer, fall, winter
    
    # Dietary flags
    is_vegetarian = Column(Boolean, default=True)
    is_vegan = Column(Boolean, default=True)
    is_gluten_free = Column(Boolean, default=True)
    is_dairy_free = Column(Boolean, default=True)
    is_nut_free = Column(Boolean, default=True)
    
    # Common allergens
    allergens = Column(ARRAY(String), default=list)
    
    # Detection metadata
    detection_keywords = Column(ARRAY(String), default=list)
    image_recognition_tags = Column(ARRAY(String), default=list)
    
    # Usage statistics
    usage_count = Column(Integer, default=0)
    detection_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    category = relationship("IngredientCategory", back_populates="ingredients")
    recipe_ingredients = relationship("RecipeIngredient", back_populates="ingredient")
    detections = relationship("IngredientDetection", back_populates="ingredient")
    nutrition_info = relationship("NutritionInfo", back_populates="ingredient", uselist=False)


class IngredientDetection(Base):
    """Ingredient detection results from image analysis"""
    __tablename__ = "ingredient_detections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=False)
    
    # Detection details
    image_url = Column(String(500), nullable=False)
    confidence_score = Column(Float, nullable=False)
    bounding_box = Column(JSON, nullable=True)  # x, y, width, height
    detection_method = Column(String(50), nullable=False)  # yolo, manual, etc.
    
    # User confirmation
    is_confirmed = Column(Boolean, default=False)
    user_feedback = Column(String(20), nullable=True)  # correct, incorrect, partial
    
    # Quantity estimation
    estimated_quantity = Column(Float, nullable=True)
    estimated_unit = Column(String(20), nullable=True)
    quantity_confidence = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="ingredient_detections")
    ingredient = relationship("Ingredient", back_populates="detections")


class NutritionInfo(Base):
    """Detailed nutritional information for ingredients"""
    __tablename__ = "nutrition_info"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=False)
    
    # Macronutrients (per 100g)
    calories = Column(Float, nullable=True)
    protein = Column(Float, nullable=True)
    total_fat = Column(Float, nullable=True)
    saturated_fat = Column(Float, nullable=True)
    trans_fat = Column(Float, nullable=True)
    cholesterol = Column(Float, nullable=True)
    total_carbs = Column(Float, nullable=True)
    dietary_fiber = Column(Float, nullable=True)
    total_sugars = Column(Float, nullable=True)
    added_sugars = Column(Float, nullable=True)
    sodium = Column(Float, nullable=True)
    
    # Vitamins (in mg or μg)
    vitamin_a = Column(Float, nullable=True)
    vitamin_c = Column(Float, nullable=True)
    vitamin_d = Column(Float, nullable=True)
    vitamin_e = Column(Float, nullable=True)
    vitamin_k = Column(Float, nullable=True)
    thiamine = Column(Float, nullable=True)
    riboflavin = Column(Float, nullable=True)
    niacin = Column(Float, nullable=True)
    vitamin_b6 = Column(Float, nullable=True)
    folate = Column(Float, nullable=True)
    vitamin_b12 = Column(Float, nullable=True)
    
    # Minerals (in mg)
    calcium = Column(Float, nullable=True)
    iron = Column(Float, nullable=True)
    magnesium = Column(Float, nullable=True)
    phosphorus = Column(Float, nullable=True)
    potassium = Column(Float, nullable=True)
    zinc = Column(Float, nullable=True)
    copper = Column(Float, nullable=True)
    manganese = Column(Float, nullable=True)
    selenium = Column(Float, nullable=True)
    
    # Additional nutrients
    omega_3 = Column(Float, nullable=True)
    omega_6 = Column(Float, nullable=True)
    antioxidants = Column(JSON, default=dict)
    
    # Data source and quality
    data_source = Column(String(100), nullable=True)
    data_quality_score = Column(Float, nullable=True)
    last_verified = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    ingredient = relationship("Ingredient", back_populates="nutrition_info")