"""
Database connection and session management
Async SQLAlchemy setup with PostgreSQL
"""

from typing import AsyncGenerator, Any
import asyncio
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    create_async_engine,
    async_sessionmaker
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from loguru import logger

from app.core.config import settings

# Create async engine
async_engine: AsyncEngine = create_async_engine(
    settings.database_url_async,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=20,
    max_overflow=0,
    future=True,
)

# Create sync engine for migrations and utilities
sync_engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=20,
    max_overflow=0,
    future=True,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Create sync session factory for migrations
SessionLocal = sessionmaker(
    sync_engine,
    autocommit=False,
    autoflush=False,
)

# Create declarative base
Base = declarative_base()

# Metadata for table creation
metadata = MetaData()


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get async database session
    Yields an async session and ensures proper cleanup
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()


def get_sync_session() -> Session:
    """
    Get synchronous database session for migrations and utilities
    """
    return SessionLocal()


async def init_db() -> None:
    """
    Initialize database by creating all tables
    This function should be called on application startup
    """
    try:
        # Import all models to ensure they are registered with SQLAlchemy
        from app.models import (
            user,
            recipe,
            ingredient,
            nutrition,
            review,
            favorite,
            shopping_list
        )
        
        # Create all tables
        async with async_engine.begin() as conn:
            # Drop all tables in development (be careful!)
            if settings.DEBUG and settings.ENVIRONMENT == "development":
                await conn.run_sync(Base.metadata.drop_all)
                logger.info("🗑️  Dropped all tables (development mode)")
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            logger.info("✅ Database tables created successfully")
            
    except Exception as e:
        logger.error(f"❌ Error initializing database: {e}")
        raise


async def close_db() -> None:
    """
    Close database connections
    This function should be called on application shutdown
    """
    try:
        await async_engine.dispose()
        sync_engine.dispose()
        logger.info("✅ Database connections closed")
    except Exception as e:
        logger.error(f"❌ Error closing database connections: {e}")


class DatabaseManager:
    """
    Database manager class for handling database operations
    """
    
    def __init__(self):
        self.async_engine = async_engine
        self.sync_engine = sync_engine
        
    async def health_check(self) -> bool:
        """
        Check database health by executing a simple query
        """
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute("SELECT 1")
                return result.scalar() == 1
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    async def create_tables(self) -> None:
        """
        Create all database tables
        """
        async with self.async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    async def drop_tables(self) -> None:
        """
        Drop all database tables (use with caution!)
        """
        async with self.async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    async def get_table_info(self) -> dict:
        """
        Get information about database tables
        """
        async with AsyncSessionLocal() as session:
            result = await session.execute("""
                SELECT table_name, column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public'
                ORDER BY table_name, ordinal_position
            """)
            
            tables = {}
            for row in result:
                table_name = row.table_name
                if table_name not in tables:
                    tables[table_name] = []
                tables[table_name].append({
                    "column": row.column_name,
                    "type": row.data_type
                })
            
            return tables


# Create global database manager instance
db_manager = DatabaseManager()


# Database utility functions
async def execute_raw_sql(query: str, params: dict = None) -> Any:
    """
    Execute raw SQL query with parameters
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(query, params or {})
        await session.commit()
        return result


async def check_database_connection() -> bool:
    """
    Check if database connection is working
    """
    try:
        return await db_manager.health_check()
    except Exception:
        return False


# Transaction decorator
from functools import wraps
from typing import Callable


def transactional(func: Callable) -> Callable:
    """
    Decorator to wrap function in database transaction
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        async with AsyncSessionLocal() as session:
            try:
                result = await func(session, *args, **kwargs)
                await session.commit()
                return result
            except Exception as e:
                await session.rollback()
                logger.error(f"Transaction failed: {e}")
                raise
    return wrapper


# Connection pool monitoring
async def get_pool_status() -> dict:
    """
    Get database connection pool status
    """
    pool = async_engine.pool
    return {
        "size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "invalid": pool.invalid(),
    }