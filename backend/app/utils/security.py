"""Security utilities for authentication and authorization."""

import os
from datetime import datetime, timedelta
from typing import Any, Union, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: The plain text password
        hashed_password: The hashed password to verify against
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        The hashed password
    """
    return pwd_context.hash(password)


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: The data to encode in the token
        expires_delta: Custom expiration time, uses default if None
        
    Returns:
        The encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        data: The data to encode in the token
        expires_delta: Custom expiration time, uses default if None
        
    Returns:
        The encoded JWT refresh token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token.
    
    Args:
        token: The JWT token to decode
        
    Returns:
        The decoded token data if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def generate_api_key() -> str:
    """
    Generate a secure API key.
    
    Returns:
        A random API key
    """
    import secrets
    return secrets.token_urlsafe(32)


def validate_api_key(api_key: str) -> bool:
    """
    Validate an API key.
    
    Args:
        api_key: The API key to validate
        
    Returns:
        True if valid, False otherwise
    """
    # In a real application, you would check this against a database
    # For demo purposes, we'll just check if it's not empty
    return bool(api_key and len(api_key) >= 32)


def create_session_token() -> str:
    """
    Create a session token for temporary authentication.
    
    Returns:
        A secure session token
    """
    import secrets
    return secrets.token_urlsafe(24)


def hash_file_content(content: bytes) -> str:
    """
    Create a hash of file content for integrity checking.
    
    Args:
        content: The file content to hash
        
    Returns:
        SHA256 hash of the content
    """
    import hashlib
    return hashlib.sha256(content).hexdigest()


def generate_csrf_token() -> str:
    """
    Generate a CSRF token for form protection.
    
    Returns:
        A CSRF token
    """
    import secrets
    return secrets.token_urlsafe(32)


def validate_csrf_token(token: str, session_token: str) -> bool:
    """
    Validate a CSRF token against a session.
    
    Args:
        token: The CSRF token to validate
        session_token: The session token to validate against
        
    Returns:
        True if valid, False otherwise
    """
    # Simple validation - in production, you'd want more sophisticated logic
    return bool(token and session_token and len(token) >= 32)


class SecurityHeaders:
    """Security headers for HTTP responses."""
    
    @staticmethod
    def get_security_headers() -> dict:
        """
        Get security headers for HTTP responses.
        
        Returns:
            Dictionary of security headers
        """
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self'; "
                "connect-src 'self' https:; "
                "media-src 'self'; "
                "object-src 'none'; "
                "child-src 'none'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self';"
            ),
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": (
                "accelerometer=(), "
                "camera=(), "
                "geolocation=(), "
                "gyroscope=(), "
                "magnetometer=(), "
                "microphone=(), "
                "payment=(), "
                "usb=()"
            )
        }


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to prevent directory traversal attacks.
    
    Args:
        filename: The filename to sanitize
        
    Returns:
        A sanitized filename
    """
    import re
    import os.path
    
    # Remove any path components
    filename = os.path.basename(filename)
    
    # Remove or replace dangerous characters
    filename = re.sub(r'[^\w\s.-]', '', filename)
    
    # Remove leading dots and spaces
    filename = filename.lstrip('. ')
    
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:251 - len(ext)] + ext
    
    # Ensure we have a filename
    if not filename:
        filename = "unnamed_file"
    
    return filename


def validate_file_type(filename: str, allowed_extensions: list = None) -> bool:
    """
    Validate file type based on extension.
    
    Args:
        filename: The filename to validate
        allowed_extensions: List of allowed extensions, uses default if None
        
    Returns:
        True if file type is allowed, False otherwise
    """
    if allowed_extensions is None:
        allowed_extensions = settings.allowed_extensions_list
    
    file_ext = os.path.splitext(filename.lower())[1]
    return file_ext in [ext.lower() for ext in allowed_extensions]