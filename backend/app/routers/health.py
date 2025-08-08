"""Health check and system status endpoints."""

import os
import time
from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..database.database import get_db
from ..utils.config import settings
from ..utils.logger import logger

router = APIRouter()


@router.get("/health")
async def health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Basic health check endpoint.
    
    Returns system status and basic information.
    """
    start_time = time.time()
    
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        db_status = "healthy"
        db_response_time = (time.time() - start_time) * 1000
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
        db_status = "unhealthy"
        db_response_time = None
    
    # Check Redis connection (if configured)
    redis_status = "not_configured"
    try:
        import redis
        redis_client = redis.from_url(settings.REDIS_URL)
        redis_client.ping()
        redis_status = "healthy"
    except Exception:
        redis_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.API_VERSION,
        "environment": settings.ENVIRONMENT,
        "uptime_seconds": time.time() - start_time,
        "services": {
            "database": {
                "status": db_status,
                "response_time_ms": db_response_time
            },
            "redis": {
                "status": redis_status
            }
        }
    }


@router.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Detailed health check with system information.
    
    Includes database statistics, memory usage, and other system metrics.
    """
    start_time = time.time()
    
    # Basic health info
    basic_health = await health_check(db)
    
    # Additional system information
    system_info = {
        "python_version": os.sys.version,
        "platform": os.name,
        "process_id": os.getpid(),
        "working_directory": os.getcwd(),
    }
    
    # Database statistics
    db_stats = {}
    try:
        # Count total users
        result = db.execute(text("SELECT COUNT(*) FROM users"))
        db_stats["total_users"] = result.scalar()
        
        # Count total recipes
        result = db.execute(text("SELECT COUNT(*) FROM recipes"))
        db_stats["total_recipes"] = result.scalar()
        
        # Count total ingredients
        result = db.execute(text("SELECT COUNT(*) FROM ingredients"))
        db_stats["total_ingredients"] = result.scalar()
        
        # Count total images
        result = db.execute(text("SELECT COUNT(*) FROM image_uploads"))
        db_stats["total_images"] = result.scalar()
        
    except Exception as e:
        logger.error("Failed to get database statistics", error=str(e))
        db_stats["error"] = "Failed to retrieve database statistics"
    
    # Memory usage (if psutil is available)
    memory_info = {}
    try:
        import psutil
        process = psutil.Process()
        memory_info = {
            "memory_percent": process.memory_percent(),
            "memory_mb": process.memory_info().rss / 1024 / 1024,
            "cpu_percent": process.cpu_percent()
        }
    except ImportError:
        memory_info["error"] = "psutil not available"
    except Exception as e:
        memory_info["error"] = str(e)
    
    # Configuration info (non-sensitive)
    config_info = {
        "debug_mode": settings.DEBUG,
        "database_configured": bool(settings.DATABASE_URL),
        "redis_configured": bool(settings.REDIS_URL),
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "max_file_size_mb": settings.MAX_FILE_SIZE / (1024 * 1024),
        "allowed_extensions": settings.allowed_extensions_list,
    }
    
    return {
        **basic_health,
        "detailed": True,
        "response_time_ms": (time.time() - start_time) * 1000,
        "system": system_info,
        "database_stats": db_stats,
        "memory": memory_info,
        "configuration": config_info
    }


@router.get("/health/database")
async def database_health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Database-specific health check.
    
    Tests database connectivity and basic operations.
    """
    start_time = time.time()
    
    checks = {
        "connection": False,
        "read_operation": False,
        "tables_exist": False,
    }
    
    errors = []
    
    try:
        # Test basic connection
        db.execute(text("SELECT 1"))
        checks["connection"] = True
        
        # Test read operation
        result = db.execute(text("SELECT COUNT(*) FROM users"))
        user_count = result.scalar()
        checks["read_operation"] = True
        
        # Check if main tables exist
        tables_query = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'recipes', 'ingredients', 'image_uploads')
        """)
        result = db.execute(tables_query)
        existing_tables = [row[0] for row in result.fetchall()]
        checks["tables_exist"] = len(existing_tables) >= 4
        
        if not checks["tables_exist"]:
            errors.append(f"Missing tables. Found: {existing_tables}")
            
    except Exception as e:
        errors.append(str(e))
        logger.error("Database health check failed", error=str(e))
    
    response_time = (time.time() - start_time) * 1000
    all_checks_passed = all(checks.values())
    
    return {
        "status": "healthy" if all_checks_passed else "unhealthy",
        "response_time_ms": response_time,
        "checks": checks,
        "errors": errors,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health/ready")
async def readiness_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Kubernetes-style readiness check.
    
    Returns 200 if the service is ready to accept traffic.
    """
    try:
        # Basic database check
        db.execute(text("SELECT 1"))
        
        # Check if required environment variables are set
        required_vars = ['SECRET_KEY', 'DATABASE_URL']
        missing_vars = [var for var in required_vars if not getattr(settings, var, None)]
        
        if missing_vars:
            raise HTTPException(
                status_code=503,
                detail=f"Missing required configuration: {missing_vars}"
            )
        
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("Readiness check failed", error=str(e))
        raise HTTPException(
            status_code=503,
            detail="Service not ready"
        )


@router.get("/health/live")
async def liveness_check() -> Dict[str, Any]:
    """
    Kubernetes-style liveness check.
    
    Returns 200 if the service is alive (basic functionality).
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": time.time()
    }