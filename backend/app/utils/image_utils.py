"""
Image utility functions for processing and validation
"""

from PIL import Image
import numpy as np
from io import BytesIO
from typing import Tuple


def resize_image(image: Image.Image, max_size: int = 1024) -> Image.Image:
    """Resize image while maintaining aspect ratio"""
    if max(image.size) > max_size:
        ratio = max_size / max(image.size)
        new_size = tuple(int(dim * ratio) for dim in image.size)
        return image.resize(new_size, Image.Resampling.LANCZOS)
    return image


def enhance_image(image: Image.Image) -> Image.Image:
    """Enhance image quality for better detection"""
    # Basic enhancement (placeholder)
    return image


def preprocess_for_detection(image: Image.Image) -> np.ndarray:
    """Preprocess image for computer vision detection"""
    # Convert to numpy array
    return np.array(image)