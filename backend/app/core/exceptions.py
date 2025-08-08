"""
Custom Exception Handlers
Centralized exception handling for the FastAPI application
"""

import logging
from typing import Union
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


class CustomException(Exception):
    """Base custom exception class"""
    def __init__(self, message: str, status_code: int = 500, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class IngredientDetectionError(CustomException):
    """Exception for ingredient detection errors"""
    def __init__(self, message: str = "Ingredient detection failed", details: dict = None):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY, details)


class RecipeGenerationError(CustomException):
    """Exception for recipe generation errors"""
    def __init__(self, message: str = "Recipe generation failed", details: dict = None):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY, details)


class DatabaseError(CustomException):
    """Exception for database errors"""
    def __init__(self, message: str = "Database operation failed", details: dict = None):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR, details)


class AuthenticationError(CustomException):
    """Exception for authentication errors"""
    def __init__(self, message: str = "Authentication failed", details: dict = None):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, details)


class AuthorizationError(CustomException):
    """Exception for authorization errors"""
    def __init__(self, message: str = "Not authorized", details: dict = None):
        super().__init__(message, status.HTTP_403_FORBIDDEN, details)


async def custom_exception_handler(request: Request, exc: CustomException) -> JSONResponse:
    """Handle custom exceptions"""
    logger.error(f"Custom exception: {exc.message}", extra={
        "path": request.url.path,
        "method": request.method,
        "details": exc.details
    })
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "details": exc.details,
            "type": exc.__class__.__name__
        }
    )


async def validation_exception_handler(request: Request, exc: Union[RequestValidationError, ValidationError]) -> JSONResponse:
    """Handle validation exceptions"""
    logger.warning(f"Validation error: {exc}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "message": "Validation error",
            "details": exc.errors() if hasattr(exc, 'errors') else str(exc),
            "type": "ValidationError"
        }
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions"""
    logger.warning(f"HTTP exception: {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "type": "HTTPException"
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions"""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "message": "Internal server error",
            "type": "InternalServerError"
        }
    )