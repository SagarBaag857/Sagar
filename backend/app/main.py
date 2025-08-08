"""Main FastAPI application entry point."""

import time
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

from .utils.config import settings
from .utils.logger import logger, log_api_request, log_error
from .utils.security import SecurityHeaders
from .database.database import create_database
from .routers import (
    auth,
    users,
    ingredients,
    recipes,
    images,
    nutrition,
    budget,
    ai,
    health
)

# Import all models to ensure they're registered with SQLAlchemy
from .models import *


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting AI Recipe Generator API", version=settings.API_VERSION)
    
    # Create database tables
    try:
        create_database()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error("Failed to create database tables", error=str(e))
        raise
    
    # Initialize any async services here
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Recipe Generator API")


# Create FastAPI application
app = FastAPI(
    title="AI Recipe Generator API",
    description="""
    A comprehensive API for generating recipes from fridge ingredients using computer vision and AI.
    
    ## Features
    
    * **Computer Vision**: Analyze fridge photos to detect ingredients
    * **AI Recipe Generation**: Generate personalized recipes based on available ingredients
    * **Nutrition Analysis**: Detailed nutritional breakdown for recipes
    * **Budget Mode**: Cost-effective meal suggestions
    * **User Management**: User profiles with dietary preferences
    * **Image Processing**: Advanced image upload and processing capabilities
    
    ## Authentication
    
    Most endpoints require authentication using JWT tokens. Register a new account
    or login to get an access token.
    """,
    version=settings.API_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url=f"/api/{settings.API_VERSION}/openapi.json",
    lifespan=lifespan
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    
    # Add security headers
    security_headers = SecurityHeaders.get_security_headers()
    for header, value in security_headers.items():
        response.headers[header] = value
    
    return response


# Request timing and logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing information."""
    start_time = time.time()
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Log request
    log_api_request(
        method=request.method,
        path=str(request.url.path),
        status_code=response.status_code,
        duration=duration
    )
    
    # Add timing header
    response.headers["X-Process-Time"] = str(duration)
    
    return response


# Error handling middleware
@app.middleware("http")
async def catch_exceptions(request: Request, call_next):
    """Catch and handle all exceptions."""
    try:
        return await call_next(request)
    except Exception as e:
        log_error(e, {"path": str(request.url.path), "method": request.method})
        
        if settings.DEBUG:
            # In debug mode, let FastAPI handle the exception
            raise
        else:
            # In production, return a generic error
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal server error",
                    "message": "An unexpected error occurred. Please try again later.",
                    "request_id": getattr(request.state, "request_id", None)
                }
            )


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
    expose_headers=["X-Process-Time"],
)

# Trusted host middleware (security)
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "*.recipeai.com"]
    )

# Gzip compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Rate limiting would go here in production
# app.add_middleware(SlowAPIMiddleware, ...)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# API routes
api_prefix = f"/api/{settings.API_VERSION}"

app.include_router(health.router, prefix=api_prefix, tags=["Health"])
app.include_router(auth.router, prefix=api_prefix, tags=["Authentication"])
app.include_router(users.router, prefix=api_prefix, tags=["Users"])
app.include_router(ingredients.router, prefix=api_prefix, tags=["Ingredients"])
app.include_router(recipes.router, prefix=api_prefix, tags=["Recipes"])
app.include_router(images.router, prefix=api_prefix, tags=["Images"])
app.include_router(nutrition.router, prefix=api_prefix, tags=["Nutrition"])
app.include_router(budget.router, prefix=api_prefix, tags=["Budget"])
app.include_router(ai.router, prefix=api_prefix, tags=["AI & Computer Vision"])


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "AI Recipe Generator API",
        "version": settings.API_VERSION,
        "description": "Generate recipes from fridge ingredients using AI and computer vision",
        "docs_url": f"/docs",
        "health_check": f"{api_prefix}/health",
        "features": [
            "Computer Vision ingredient detection",
            "AI-powered recipe generation", 
            "Nutritional analysis",
            "Budget mode",
            "User profiles and preferences",
            "Recipe ratings and favorites"
        ],
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG
    }


# Global exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url.path)
        }
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle value errors."""
    log_error(exc, {"path": str(request.url.path)})
    return JSONResponse(
        status_code=400,
        content={
            "error": "Invalid value",
            "message": str(exc),
            "path": str(request.url.path)
        }
    )


@app.exception_handler(KeyError)
async def key_error_handler(request: Request, exc: KeyError):
    """Handle key errors."""
    log_error(exc, {"path": str(request.url.path)})
    return JSONResponse(
        status_code=400,
        content={
            "error": "Missing required field",
            "message": f"Missing field: {str(exc)}",
            "path": str(request.url.path)
        }
    )


# Development server
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower(),
        workers=1 if settings.RELOAD else settings.WORKERS
    )