"""
Redis Client Configuration
Redis setup for caching and session management
"""

import redis.asyncio as redis
from loguru import logger
from app.core.config import settings

# Global Redis client
redis_client = None


async def init_redis():
    """Initialize Redis connection"""
    global redis_client
    
    try:
        redis_client = redis.from_url(
            settings.REDIS_URL,
            password=settings.REDIS_PASSWORD,
            decode_responses=True,
            retry_on_timeout=True,
            health_check_interval=30
        )
        
        # Test connection
        await redis_client.ping()
        logger.info("✅ Redis connected successfully")
        
    except Exception as e:
        logger.warning(f"⚠️ Redis connection failed: {e}")
        redis_client = None


async def get_redis():
    """Get Redis client instance"""
    return redis_client


async def cache_set(key: str, value: str, ttl: int = None):
    """Set value in cache"""
    if redis_client:
        try:
            await redis_client.set(key, value, ex=ttl or settings.CACHE_TTL)
        except Exception as e:
            logger.warning(f"Cache set failed: {e}")


async def cache_get(key: str):
    """Get value from cache"""
    if redis_client:
        try:
            return await redis_client.get(key)
        except Exception as e:
            logger.warning(f"Cache get failed: {e}")
    return None