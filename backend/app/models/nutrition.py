from sqlalchemy import Column, String, Float, ForeignKey, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.core.database import Base

class NutrientType(str, enum.Enum):
    CALORIE = "calorie"
    PROTEIN = "protein"
    CARB = "carb"
    FAT = "fat"
    FIBER = "fiber"
    SUGAR = "sugar"
    SODIUM = "sodium"

class NutritionAnalysis(Base):
    __tablename__ = "nutrition_analyses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.id"), nullable=False)
    
    total_calories = Column(Float, nullable=True)
    total_protein = Column(Float, nullable=True)
    total_carbs = Column(Float, nullable=True)
    total_fat = Column(Float, nullable=True)
    total_fiber = Column(Float, nullable=True)
    total_sugar = Column(Float, nullable=True)
    total_sodium = Column(Float, nullable=True)
    
    detailed_breakdown = Column(JSON, default=dict)
    created_at = Column(DateTime, default=func.now())
    
    recipe = relationship("Recipe", back_populates="nutrition_analysis")