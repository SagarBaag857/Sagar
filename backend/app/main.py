"""
AI Recipe Generator - FastAPI Backend
Main application entry point with comprehensive setup
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
import uvicorn
from loguru import logger
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from app.core.config import settings
from app.core.database import init_db
from app.core.redis_client import init_redis
from app.api.v1.router import api_router
from app.core.logging import setup_logging
from app.core.security import get_current_user
from app.core.exceptions import (
    CustomException,
    custom_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    general_exception_handler
)

# Setup logging
setup_logging()

# Initialize Sentry for error tracking
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[
            FastApiIntegration(auto_enabling=True),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=0.1,
        environment=settings.ENVIRONMENT,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🚀 Starting AI Recipe Generator Backend")
    
    # Initialize database
    await init_db()
    logger.info("✅ Database initialized")
    
    # Initialize Redis
    await init_redis()
    logger.info("✅ Redis initialized")
    
    # Download ML models if needed
    from app.services.ml_service import MLService
    ml_service = MLService()
    await ml_service.initialize_models()
    logger.info("✅ ML models initialized")
    
    yield
    
    logger.info("🛑 Shutting down AI Recipe Generator Backend")


def create_application() -> FastAPI:
    """Create and configure FastAPI application"""
    
    app = FastAPI(
        title="AI Recipe Generator API",
        description="""
        # AI Recipe Generator Backend
        
        A comprehensive API for generating recipes from fridge contents using computer vision and AI.
        
        ## Features
        - 📸 **Image Analysis**: Upload fridge photos for ingredient detection
        - 🤖 **AI Recipe Generation**: Get personalized recipes based on available ingredients
        - 📊 **Nutrition Analysis**: Detailed nutritional breakdown for each recipe
        - 💰 **Budget Mode**: Cost-effective meal suggestions
        - 👤 **User Management**: Personal profiles and preferences
        - 📱 **Mobile Ready**: Optimized for mobile applications
        
        ## Getting Started
        1. Create an account using `/auth/register`
        2. Upload a fridge image via `/api/v1/ingredients/detect-from-image`
        3. Get recipe suggestions using `/api/v1/recipes/generate`
        4. Enjoy cooking! 👨‍🍳
        """,
        version="1.0.0",
        contact={
            "name": "AI Recipe Generator Team",
            "email": "support@airecipegen.com",
        },
        license_info={
            "name": "MIT",
            "url": "https://opensource.org/licenses/MIT",
        },
        lifespan=lifespan,
        docs_url=None,  # Disable default docs
        redoc_url=None,  # Disable default redoc
    )
    
    # Add middleware
    setup_middleware(app)
    
    # Add exception handlers
    setup_exception_handlers(app)
    
    # Include routers
    app.include_router(api_router, prefix="/api/v1")
    
    # Add custom routes
    setup_custom_routes(app)
    
    return app


def setup_middleware(app: FastAPI) -> None:
    """Setup application middleware"""
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Trusted host middleware
    if settings.ALLOWED_HOSTS:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.ALLOWED_HOSTS
        )
    
    # Request logging middleware
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start_time = time.time()
        
        # Log request
        logger.info(
            f"Request: {request.method} {request.url.path} "
            f"from {request.client.host if request.client else 'unknown'}"
        )
        
        response = await call_next(request)
        
        # Log response
        process_time = time.time() - start_time
        logger.info(
            f"Response: {response.status_code} "
            f"processed in {process_time:.3f}s"
        )
        
        return response


def setup_exception_handlers(app: FastAPI) -> None:
    """Setup custom exception handlers"""
    
    app.add_exception_handler(CustomException, custom_exception_handler)
    app.add_exception_handler(422, validation_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)


def setup_custom_routes(app: FastAPI) -> None:
    """Setup custom routes for documentation and health checks"""
    
    @app.get("/", include_in_schema=False)
    async def root():
        """API root endpoint"""
        return {
            "message": "Welcome to AI Recipe Generator API",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/health"
        }
    
    @app.get("/health", include_in_schema=False)
    async def health_check():
        """Health check endpoint"""
        return {
            "status": "healthy",
            "environment": settings.ENVIRONMENT,
            "version": "1.0.0"
        }
    
    @app.get("/docs", include_in_schema=False)
    async def custom_swagger_ui_html():
        """Custom Swagger UI"""
        return get_swagger_ui_html(
            openapi_url="/openapi.json",
            title="AI Recipe Generator API - Interactive Documentation",
            swagger_favicon_url="/favicon.ico",
        )
    
    @app.get("/openapi.json", include_in_schema=False)
    async def get_open_api_endpoint():
        """Custom OpenAPI schema"""
        return get_openapi(
            title="AI Recipe Generator API",
            version="1.0.0",
            routes=app.routes,
        )


# Import time module for middleware
import time

# Create the application instance
app = create_application()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug",
        access_log=True,
    )