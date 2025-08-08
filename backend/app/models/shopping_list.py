from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base

class ShoppingList(Base):
    __tablename__ = "shopping_lists"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="shopping_lists")
    items = relationship("ShoppingListItem", back_populates="shopping_list", cascade="all, delete-orphan")

class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shopping_list_id = Column(UUID(as_uuid=True), ForeignKey("shopping_lists.id"), nullable=False)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=True)
    
    name = Column(String(200), nullable=False)
    quantity = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    is_purchased = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=func.now())
    
    shopping_list = relationship("ShoppingList", back_populates="items")
    ingredient = relationship("Ingredient")