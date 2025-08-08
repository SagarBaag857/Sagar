"""Application configuration management."""

import os
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings configuration."""
    
    # Application Configuration
    APP_NAME: str = Field(default="AI Recipe Generator", env="APP_NAME")
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    API_VERSION: str = Field(default="v1", env="API_VERSION")
    SECRET_KEY: str = Field(default="dev-secret-key", env="SECRET_KEY")
    
    # Database Configuration
    DATABASE_URL: str = Field(
        default="sqlite:///./recipe_app.db",
        env="DATABASE_URL"
    )
    DB_HOST: str = Field(default="localhost", env="DB_HOST")
    DB_PORT: int = Field(default=5432, env="DB_PORT")
    DB_NAME: str = Field(default="recipe_db", env="DB_NAME")
    DB_USER: str = Field(default="recipe_user", env="DB_USER")
    DB_PASSWORD: str = Field(default="recipe_password", env="DB_PASSWORD")
    
    # Redis Configuration
    REDIS_URL: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    REDIS_HOST: str = Field(default="localhost", env="REDIS_HOST")
    REDIS_PORT: int = Field(default=6379, env="REDIS_PORT")
    REDIS_DB: int = Field(default=0, env="REDIS_DB")
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = Field(default="", env="OPENAI_API_KEY")
    OPENAI_MODEL: str = Field(default="gpt-4", env="OPENAI_MODEL")
    OPENAI_MAX_TOKENS: int = Field(default=4000, env="OPENAI_MAX_TOKENS")
    
    # Security Configuration
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, env="REFRESH_TOKEN_EXPIRE_DAYS")
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = Field(default=10485760, env="MAX_FILE_SIZE")  # 10MB
    ALLOWED_EXTENSIONS: str = Field(
        default=".jpg,.jpeg,.png,.gif,.bmp,.webp",
        env="ALLOWED_EXTENSIONS"
    )
    UPLOAD_DIRECTORY: str = Field(default="uploads", env="UPLOAD_DIRECTORY")
    
    # Computer Vision Configuration
    CV_MODEL_PATH: str = Field(
        default="models/ingredient_detection_model.h5",
        env="CV_MODEL_PATH"
    )
    CV_CONFIDENCE_THRESHOLD: float = Field(default=0.7, env="CV_CONFIDENCE_THRESHOLD")
    CV_MAX_DETECTIONS: int = Field(default=50, env="CV_MAX_DETECTIONS")
    
    # Recipe Generation Configuration
    MAX_RECIPES_PER_REQUEST: int = Field(default=10, env="MAX_RECIPES_PER_REQUEST")
    DEFAULT_SERVING_SIZE: int = Field(default=4, env="DEFAULT_SERVING_SIZE")
    MAX_INGREDIENTS_PER_RECIPE: int = Field(default=20, env="MAX_INGREDIENTS_PER_RECIPE")
    
    # Nutrition API Configuration
    NUTRITION_API_KEY: str = Field(default="", env="NUTRITION_API_KEY")
    NUTRITION_API_URL: str = Field(
        default="https://api.nal.usda.gov/fdc/v1",
        env="NUTRITION_API_URL"
    )
    
    # Budget Mode Configuration
    BUDGET_THRESHOLD_LOW: float = Field(default=5.00, env="BUDGET_THRESHOLD_LOW")
    BUDGET_THRESHOLD_MEDIUM: float = Field(default=15.00, env="BUDGET_THRESHOLD_MEDIUM")
    BUDGET_THRESHOLD_HIGH: float = Field(default=30.00, env="BUDGET_THRESHOLD_HIGH")
    
    # Email Configuration
    SMTP_HOST: str = Field(default="smtp.gmail.com", env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USER: str = Field(default="", env="SMTP_USER")
    SMTP_PASSWORD: str = Field(default="", env="SMTP_PASSWORD")
    EMAIL_FROM: str = Field(default="noreply@recipeai.com", env="EMAIL_FROM")
    
    # Logging Configuration
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(default="json", env="LOG_FORMAT")
    LOG_FILE: str = Field(default="logs/app.log", env="LOG_FILE")
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    RATE_LIMIT_PER_HOUR: int = Field(default=1000, env="RATE_LIMIT_PER_HOUR")
    
    # Celery Configuration
    CELERY_BROKER_URL: str = Field(
        default="redis://localhost:6379/0",
        env="CELERY_BROKER_URL"
    )
    CELERY_RESULT_BACKEND: str = Field(
        default="redis://localhost:6379/0",
        env="CELERY_RESULT_BACKEND"
    )
    CELERY_TASK_SERIALIZER: str = Field(default="json", env="CELERY_TASK_SERIALIZER")
    CELERY_RESULT_SERIALIZER: str = Field(default="json", env="CELERY_RESULT_SERIALIZER")
    CELERY_ACCEPT_CONTENT: List[str] = Field(default=["json"], env="CELERY_ACCEPT_CONTENT")
    CELERY_TIMEZONE: str = Field(default="UTC", env="CELERY_TIMEZONE")
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        env="CORS_ORIGINS"
    )
    CORS_ALLOW_CREDENTIALS: bool = Field(default=True, env="CORS_ALLOW_CREDENTIALS")
    CORS_ALLOW_METHODS: List[str] = Field(
        default=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        env="CORS_ALLOW_METHODS"
    )
    CORS_ALLOW_HEADERS: List[str] = Field(default=["*"], env="CORS_ALLOW_HEADERS")
    
    # Development Configuration
    RELOAD: bool = Field(default=True, env="RELOAD")
    WORKERS: int = Field(default=1, env="WORKERS")
    
    # Monitoring
    SENTRY_DSN: Optional[str] = Field(default=None, env="SENTRY_DSN")
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        """Get list of allowed file extensions."""
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.ENVIRONMENT.lower() == "development"
    
    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings