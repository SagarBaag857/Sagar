"""Logging configuration and utilities."""

import logging
import logging.config
import os
import sys
from typing import Dict, Any

import structlog
from structlog import configure, get_logger
from structlog.stdlib import LoggerFactory

from .config import settings


def configure_logging() -> None:
    """Configure structured logging for the application."""
    
    # Create logs directory if it doesn't exist
    log_dir = os.path.dirname(settings.LOG_FILE)
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir, exist_ok=True)
    
    # Configure stdlib logging
    logging_config: Dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "()": structlog.stdlib.ProcessorFormatter,
                "processor": structlog.dev.ConsoleRenderer(colors=False)
                if settings.LOG_FORMAT == "console"
                else structlog.processors.JSONRenderer(),
            },
            "console": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "console" if settings.LOG_FORMAT == "console" else "json",
                "stream": sys.stdout,
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": "json",
                "filename": settings.LOG_FILE,
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
            },
        },
        "loggers": {
            "": {
                "handlers": ["console", "file"],
                "level": settings.LOG_LEVEL,
                "propagate": False,
            },
            "uvicorn": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
            "sqlalchemy.engine": {
                "handlers": ["console", "file"],
                "level": "WARNING" if not settings.DEBUG else "INFO",
                "propagate": False,
            },
            "celery": {
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": False,
            },
        },
    }
    
    # Apply logging configuration
    logging.config.dictConfig(logging_config)
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        context_class=dict,
        logger_factory=LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


# Configure logging on import
configure_logging()

# Create logger instance
logger = get_logger("recipe_app")


class LoggerMixin:
    """Mixin to add logging capabilities to classes."""
    
    @property
    def logger(self):
        """Get logger for the current class."""
        return get_logger(self.__class__.__name__)


def log_function_call(func_name: str, **kwargs):
    """Log function call with parameters."""
    logger.info(
        "Function called",
        function=func_name,
        parameters=kwargs
    )


def log_error(error: Exception, context: Dict[str, Any] = None):
    """Log error with context information."""
    logger.error(
        "Error occurred",
        error_type=type(error).__name__,
        error_message=str(error),
        context=context or {}
    )


def log_api_request(method: str, path: str, status_code: int, duration: float):
    """Log API request information."""
    logger.info(
        "API request",
        method=method,
        path=path,
        status_code=status_code,
        duration_ms=round(duration * 1000, 2)
    )


def log_database_query(query: str, duration: float, rows_affected: int = None):
    """Log database query information."""
    logger.debug(
        "Database query",
        query=query,
        duration_ms=round(duration * 1000, 2),
        rows_affected=rows_affected
    )


def log_ai_generation(
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    duration: float
):
    """Log AI generation information."""
    logger.info(
        "AI generation",
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=prompt_tokens + completion_tokens,
        duration_ms=round(duration * 1000, 2)
    )


def log_image_processing(
    image_path: str,
    processing_type: str,
    duration: float,
    result_count: int = None
):
    """Log image processing information."""
    logger.info(
        "Image processing",
        image_path=image_path,
        processing_type=processing_type,
        duration_ms=round(duration * 1000, 2),
        result_count=result_count
    )