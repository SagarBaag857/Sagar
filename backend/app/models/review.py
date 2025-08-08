from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.core.database import Base

class ReviewStatus(str, enum.Enum):
    PUBLISHED = "published"
    PENDING = "pending"
    HIDDEN = "hidden"

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.id"), nullable=False)
    
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String(200), nullable=True)
    content = Column(Text, nullable=True)
    status = Column(SQLEnum(ReviewStatus), default=ReviewStatus.PUBLISHED)
    
    helpful_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    
    user = relationship("User", back_populates="reviews")
    recipe = relationship("Recipe", back_populates="reviews")