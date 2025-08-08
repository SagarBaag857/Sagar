"""
Application Configuration Management
Centralized configuration using Pydantic Settings with environment variable support
"""

import secrets
from typing import List, Optional, Union, Any, Dict
from pydantic import (
    BaseSettings, 
    validator, 
    Field,
    AnyHttpUrl,
    PostgresDsn,
    EmailStr
)
from pydantic_settings import BaseSettings as PydanticBaseSettings
import os
from pathlib import Path


class Settings(PydanticBaseSettings):
    """Application settings with environment variable support"""
    
    # Basic Application Settings
    APP_NAME: str = "AI Recipe Generator"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI-powered recipe generation from fridge contents"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    
    # Server Configuration
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    
    # Security
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32), env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS Settings
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
        env="ALLOWED_ORIGINS"
    )
    ALLOWED_HOSTS: List[str] = Field(default=["*"], env="ALLOWED_HOSTS")
    
    # Database Configuration
    DATABASE_URL: str = Field(
        default="postgresql://postgres:password@localhost:5432/recipe_generator",
        env="DATABASE_URL"
    )
    
    # Redis Configuration
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    REDIS_PASSWORD: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    CACHE_TTL: int = 3600  # 1 hour default cache TTL
    
    # AI Service Configuration
    OPENAI_API_KEY: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    HUGGINGFACE_API_KEY: Optional[str] = Field(default=None, env="HUGGINGFACE_API_KEY")
    
    # OpenAI Configuration
    OPENAI_MODEL: str = Field(default="gpt-4", env="OPENAI_MODEL")
    OPENAI_MAX_TOKENS: int = Field(default=2000, env="OPENAI_MAX_TOKENS")
    OPENAI_TEMPERATURE: float = Field(default=0.7, env="OPENAI_TEMPERATURE")
    
    # Computer Vision Configuration
    YOLO_MODEL_PATH: str = Field(default="yolov8n.pt", env="YOLO_MODEL_PATH")
    INGREDIENT_DETECTION_CONFIDENCE: float = Field(default=0.5, env="INGREDIENT_DETECTION_CONFIDENCE")
    MAX_IMAGE_SIZE: int = Field(default=1024, env="MAX_IMAGE_SIZE")
    ALLOWED_IMAGE_TYPES: List[str] = Field(
        default=["image/jpeg", "image/png", "image/webp"],
        env="ALLOWED_IMAGE_TYPES"
    )
    
    # File Upload Configuration
    UPLOAD_DIR: str = Field(default="uploads", env="UPLOAD_DIR")
    MAX_UPLOAD_SIZE: int = Field(default=10 * 1024 * 1024, env="MAX_UPLOAD_SIZE")  # 10MB
    
    # Nutrition API Configuration
    NUTRITION_API_KEY: Optional[str] = Field(default=None, env="NUTRITION_API_KEY")
    NUTRITION_API_URL: str = Field(
        default="https://api.edamam.com/api/nutrition-data/v2",
        env="NUTRITION_API_URL"
    )
    
    # External API Configuration
    SPOONACULAR_API_KEY: Optional[str] = Field(default=None, env="SPOONACULAR_API_KEY")
    RECIPE_PUPPY_API_URL: str = Field(
        default="http://www.recipepuppy.com/api/",
        env="RECIPE_PUPPY_API_URL"
    )
    
    # Email Configuration
    SMTP_HOST: Optional[str] = Field(default=None, env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USERNAME: Optional[str] = Field(default=None, env="SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    SMTP_TLS: bool = Field(default=True, env="SMTP_TLS")
    FROM_EMAIL: Optional[EmailStr] = Field(default=None, env="FROM_EMAIL")
    
    # Monitoring and Logging
    SENTRY_DSN: Optional[str] = Field(default=None, env="SENTRY_DSN")
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        env="LOG_FORMAT"
    )
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_WINDOW: int = Field(default=3600, env="RATE_LIMIT_WINDOW")  # 1 hour
    
    # Background Tasks
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/1", env="CELERY_BROKER_URL")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/2", env="CELERY_RESULT_BACKEND")
    
    # ML Model Paths
    INGREDIENT_MODEL_PATH: str = Field(default="ml_models/ingredient_classifier.pkl", env="INGREDIENT_MODEL_PATH")
    RECIPE_MODEL_PATH: str = Field(default="ml_models/recipe_generator.pkl", env="RECIPE_MODEL_PATH")
    
    # Business Logic Configuration
    MAX_INGREDIENTS_PER_REQUEST: int = Field(default=20, env="MAX_INGREDIENTS_PER_REQUEST")
    MAX_RECIPES_PER_REQUEST: int = Field(default=10, env="MAX_RECIPES_PER_REQUEST")
    DEFAULT_SERVING_SIZE: int = Field(default=4, env="DEFAULT_SERVING_SIZE")
    
    # Budget Mode Configuration
    BUDGET_MODE_PRICE_THRESHOLD: float = Field(default=15.0, env="BUDGET_MODE_PRICE_THRESHOLD")
    CURRENCY: str = Field(default="USD", env="CURRENCY")
    
    # Recipe Generation Parameters
    RECIPE_CREATIVITY_LEVEL: float = Field(default=0.7, env="RECIPE_CREATIVITY_LEVEL")
    INCLUDE_DIETARY_RESTRICTIONS: bool = Field(default=True, env="INCLUDE_DIETARY_RESTRICTIONS")
    GENERATE_ALTERNATIVES: bool = Field(default=True, env="GENERATE_ALTERNATIVES")
    
    # Social Features
    ENABLE_RECIPE_SHARING: bool = Field(default=True, env="ENABLE_RECIPE_SHARING")
    ENABLE_USER_REVIEWS: bool = Field(default=True, env="ENABLE_USER_REVIEWS")
    ENABLE_SOCIAL_LOGIN: bool = Field(default=True, env="ENABLE_SOCIAL_LOGIN")
    
    # Performance Configuration
    MAX_WORKERS: int = Field(default=4, env="MAX_WORKERS")
    WORKER_TIMEOUT: int = Field(default=30, env="WORKER_TIMEOUT")
    
    # Development Configuration
    RELOAD: bool = Field(default=True, env="RELOAD")
    ACCESS_LOG: bool = Field(default=True, env="ACCESS_LOG")
    
    @validator("ALLOWED_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Parse CORS origins from environment variable"""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @validator("ALLOWED_HOSTS", pre=True)
    def assemble_allowed_hosts(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Parse allowed hosts from environment variable"""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @validator("ALLOWED_IMAGE_TYPES", pre=True)
    def assemble_image_types(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Parse allowed image types from environment variable"""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @validator("DATABASE_URL", pre=True)
    def validate_database_url(cls, v: str) -> str:
        """Validate database URL format"""
        if not v.startswith(("postgresql://", "postgres://")):
            raise ValueError("DATABASE_URL must be a valid PostgreSQL URL")
        return v
    
    @validator("REDIS_URL", pre=True)
    def validate_redis_url(cls, v: str) -> str:
        """Validate Redis URL format"""
        if not v.startswith("redis://"):
            raise ValueError("REDIS_URL must be a valid Redis URL")
        return v
    
    @property
    def database_url_async(self) -> str:
        """Get async database URL for SQLAlchemy"""
        return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.ENVIRONMENT.lower() == "development"
    
    @property
    def upload_path(self) -> Path:
        """Get upload directory path"""
        path = Path(self.UPLOAD_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    def get_ai_config(self) -> Dict[str, Any]:
        """Get AI service configuration"""
        return {
            "openai": {
                "api_key": self.OPENAI_API_KEY,
                "model": self.OPENAI_MODEL,
                "max_tokens": self.OPENAI_MAX_TOKENS,
                "temperature": self.OPENAI_TEMPERATURE,
            },
            "anthropic": {
                "api_key": self.ANTHROPIC_API_KEY,
            },
            "huggingface": {
                "api_key": self.HUGGINGFACE_API_KEY,
            }
        }
    
    def get_cv_config(self) -> Dict[str, Any]:
        """Get computer vision configuration"""
        return {
            "yolo_model_path": self.YOLO_MODEL_PATH,
            "confidence_threshold": self.INGREDIENT_DETECTION_CONFIDENCE,
            "max_image_size": self.MAX_IMAGE_SIZE,
            "allowed_types": self.ALLOWED_IMAGE_TYPES,
        }
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = "utf-8"


# Create global settings instance
settings = Settings()

# Ensure upload directory exists
settings.upload_path.mkdir(parents=True, exist_ok=True)