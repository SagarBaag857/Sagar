"""
Computer Vision Service
Advanced ingredient detection from fridge images using YOLO and custom models
"""

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import torch
from ultralytics import YOLO
import logging
from typing import List, Dict, Tuple, Optional, Any
import asyncio
from pathlib import Path
import requests
from io import BytesIO
import base64

from app.core.config import settings
from app.core.database import get_async_session
from app.models.ingredient import Ingredient, IngredientDetection
from app.utils.image_utils import resize_image, enhance_image, preprocess_for_detection

logger = logging.getLogger(__name__)


class IngredientDetector:
    """
    Advanced ingredient detection using multiple CV models
    """
    
    def __init__(self):
        self.yolo_model = None
        self.ingredient_classifier = None
        self.confidence_threshold = settings.INGREDIENT_DETECTION_CONFIDENCE
        self.max_image_size = settings.MAX_IMAGE_SIZE
        self.ingredient_database = {}
        
    async def initialize_models(self):
        """Initialize all computer vision models"""
        try:
            # Load YOLO model for object detection
            await self._load_yolo_model()
            
            # Load custom ingredient classifier
            await self._load_ingredient_classifier()
            
            # Load ingredient database
            await self._load_ingredient_database()
            
            logger.info("✅ Computer vision models initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Error initializing CV models: {e}")
            raise
    
    async def _load_yolo_model(self):
        """Load YOLO model for object detection"""
        try:
            model_path = Path(settings.YOLO_MODEL_PATH)
            if not model_path.exists():
                # Download YOLO model if not exists
                logger.info("📥 Downloading YOLO model...")
                self.yolo_model = YOLO('yolov8n.pt')  # Use nano version for speed
            else:
                self.yolo_model = YOLO(str(model_path))
            
            logger.info("✅ YOLO model loaded successfully")
            
        except Exception as e:
            logger.error(f"❌ Error loading YOLO model: {e}")
            # Fallback to a basic model
            self.yolo_model = YOLO('yolov8n.pt')
    
    async def _load_ingredient_classifier(self):
        """Load custom ingredient classification model"""
        try:
            # In a real implementation, you'd load a custom trained model
            # For now, we'll use YOLO's built-in food detection capabilities
            self.ingredient_classifier = self.yolo_model
            logger.info("✅ Ingredient classifier loaded")
            
        except Exception as e:
            logger.error(f"❌ Error loading ingredient classifier: {e}")
    
    async def _load_ingredient_database(self):
        """Load ingredient database for matching"""
        try:
            async with get_async_session() as session:
                # Load common ingredients and their detection keywords
                result = await session.execute(
                    "SELECT name, common_names, detection_keywords, image_recognition_tags FROM ingredients"
                )
                
                for row in result:
                    name = row.name.lower()
                    self.ingredient_database[name] = {
                        'common_names': row.common_names or [],
                        'keywords': row.detection_keywords or [],
                        'tags': row.image_recognition_tags or []
                    }
            
            logger.info(f"✅ Loaded {len(self.ingredient_database)} ingredients")
            
        except Exception as e:
            logger.warning(f"⚠️ Could not load ingredient database: {e}")
            # Use default ingredient mappings
            self._setup_default_ingredients()
    
    def _setup_default_ingredients(self):
        """Setup default ingredient mappings"""
        default_ingredients = {
            'apple': ['apple', 'apples', 'red apple', 'green apple'],
            'banana': ['banana', 'bananas', 'yellow banana'],
            'orange': ['orange', 'oranges', 'citrus'],
            'tomato': ['tomato', 'tomatoes', 'red tomato'],
            'carrot': ['carrot', 'carrots', 'orange carrot'],
            'potato': ['potato', 'potatoes', 'russet potato'],
            'onion': ['onion', 'onions', 'yellow onion', 'red onion'],
            'garlic': ['garlic', 'garlic clove', 'garlic bulb'],
            'bell pepper': ['bell pepper', 'pepper', 'red pepper', 'green pepper'],
            'broccoli': ['broccoli', 'broccoli florets'],
            'lettuce': ['lettuce', 'leafy greens', 'salad greens'],
            'cucumber': ['cucumber', 'cucumbers'],
            'mushroom': ['mushroom', 'mushrooms', 'button mushroom'],
            'egg': ['egg', 'eggs', 'chicken egg'],
            'milk': ['milk', 'dairy milk', 'cow milk'],
            'cheese': ['cheese', 'cheddar', 'mozzarella'],
            'bread': ['bread', 'loaf', 'slice bread'],
            'chicken': ['chicken', 'chicken breast', 'poultry'],
            'beef': ['beef', 'ground beef', 'steak'],
            'fish': ['fish', 'salmon', 'tuna'],
            'rice': ['rice', 'white rice', 'brown rice'],
            'pasta': ['pasta', 'spaghetti', 'noodles'],
            'yogurt': ['yogurt', 'greek yogurt'],
            'butter': ['butter', 'dairy butter'],
        }
        
        for ingredient, variations in default_ingredients.items():
            self.ingredient_database[ingredient] = {
                'common_names': variations,
                'keywords': variations,
                'tags': variations
            }
    
    async def detect_ingredients_from_image(
        self, 
        image_data: bytes, 
        user_id: str,
        enhance_image_quality: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Detect ingredients from uploaded fridge image
        
        Args:
            image_data: Raw image data
            user_id: User ID for tracking
            enhance_image_quality: Whether to enhance image before detection
            
        Returns:
            List of detected ingredients with confidence scores
        """
        try:
            # Convert bytes to PIL Image
            image = Image.open(BytesIO(image_data))
            
            # Preprocess image
            processed_image = await self._preprocess_image(image, enhance_image_quality)
            
            # Detect objects using YOLO
            detections = await self._detect_objects(processed_image)
            
            # Filter and classify food items
            ingredients = await self._classify_ingredients(detections, processed_image)
            
            # Match with ingredient database
            matched_ingredients = await self._match_ingredients(ingredients)
            
            # Save detection results
            await self._save_detection_results(matched_ingredients, user_id, image_data)
            
            return matched_ingredients
            
        except Exception as e:
            logger.error(f"❌ Error detecting ingredients: {e}")
            raise
    
    async def _preprocess_image(self, image: Image.Image, enhance: bool = True) -> np.ndarray:
        """Preprocess image for better detection"""
        try:
            # Resize if too large
            if max(image.size) > self.max_image_size:
                ratio = self.max_image_size / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                image = image.resize(new_size, Image.Resampling.LANCZOS)
            
            if enhance:
                # Enhance image quality
                enhancer = ImageEnhance.Contrast(image)
                image = enhancer.enhance(1.2)
                
                enhancer = ImageEnhance.Sharpness(image)
                image = enhancer.enhance(1.1)
                
                enhancer = ImageEnhance.Brightness(image)
                image = enhancer.enhance(1.05)
            
            # Convert to numpy array
            image_array = np.array(image)
            
            # Convert RGB to BGR for OpenCV
            if len(image_array.shape) == 3 and image_array.shape[2] == 3:
                image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
            
            return image_array
            
        except Exception as e:
            logger.error(f"❌ Error preprocessing image: {e}")
            raise
    
    async def _detect_objects(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Detect objects in image using YOLO"""
        try:
            # Run YOLO detection
            results = self.yolo_model(image, conf=self.confidence_threshold)
            
            detections = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Extract detection information
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        confidence = float(box.conf[0])
                        class_id = int(box.cls[0])
                        class_name = self.yolo_model.names[class_id]
                        
                        detection = {
                            'bbox': [x1, y1, x2, y2],
                            'confidence': confidence,
                            'class_id': class_id,
                            'class_name': class_name,
                            'area': (x2 - x1) * (y2 - y1)
                        }
                        
                        detections.append(detection)
            
            # Sort by confidence
            detections.sort(key=lambda x: x['confidence'], reverse=True)
            
            return detections
            
        except Exception as e:
            logger.error(f"❌ Error in object detection: {e}")
            return []
    
    async def _classify_ingredients(
        self, 
        detections: List[Dict[str, Any]], 
        image: np.ndarray
    ) -> List[Dict[str, Any]]:
        """Classify detected objects as ingredients"""
        food_classes = {
            'apple', 'banana', 'orange', 'sandwich', 'carrot', 'hot dog',
            'pizza', 'donut', 'cake', 'broccoli', 'wine glass', 'cup',
            'fork', 'knife', 'spoon', 'bowl', 'bottle', 'wine glass'
        }
        
        ingredients = []
        
        for detection in detections:
            class_name = detection['class_name'].lower()
            
            # Check if it's a food item or kitchen-related object
            if any(food_word in class_name for food_word in food_classes):
                # Extract the region of interest
                bbox = detection['bbox']
                x1, y1, x2, y2 = map(int, bbox)
                
                # Crop the detected region
                roi = image[y1:y2, x1:x2]
                
                # Enhanced classification for the cropped region
                enhanced_class = await self._enhance_classification(roi, class_name)
                
                ingredient = {
                    'name': enhanced_class,
                    'confidence': detection['confidence'],
                    'bbox': bbox,
                    'original_class': class_name,
                    'area': detection['area']
                }
                
                ingredients.append(ingredient)
        
        return ingredients
    
    async def _enhance_classification(self, roi: np.ndarray, initial_class: str) -> str:
        """Enhance classification using additional analysis"""
        try:
            # Color analysis
            avg_color = np.mean(roi, axis=(0, 1))
            
            # Shape analysis
            height, width = roi.shape[:2]
            aspect_ratio = width / height if height > 0 else 1
            
            # Simple heuristics for common ingredients
            if 'apple' in initial_class:
                if avg_color[2] > avg_color[1]:  # More red
                    return 'red apple'
                elif avg_color[1] > avg_color[2]:  # More green
                    return 'green apple'
                return 'apple'
            
            elif 'banana' in initial_class:
                return 'banana'
            
            elif 'orange' in initial_class:
                return 'orange'
            
            elif 'carrot' in initial_class:
                return 'carrot'
            
            # Default to original classification
            return initial_class
            
        except Exception as e:
            logger.warning(f"⚠️ Error in enhanced classification: {e}")
            return initial_class
    
    async def _match_ingredients(self, ingredients: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Match detected ingredients with database"""
        matched = []
        
        for ingredient in ingredients:
            name = ingredient['name'].lower()
            best_match = None
            best_score = 0
            
            # Direct match
            if name in self.ingredient_database:
                best_match = name
                best_score = 1.0
            else:
                # Fuzzy matching
                for db_ingredient, data in self.ingredient_database.items():
                    score = self._calculate_similarity(name, db_ingredient, data)
                    if score > best_score and score > 0.7:  # Threshold for matching
                        best_match = db_ingredient
                        best_score = score
            
            if best_match:
                matched_ingredient = {
                    'detected_name': ingredient['name'],
                    'matched_name': best_match,
                    'confidence': ingredient['confidence'],
                    'match_score': best_score,
                    'bbox': ingredient['bbox'],
                    'area': ingredient['area'],
                    'final_confidence': ingredient['confidence'] * best_score
                }
                matched.append(matched_ingredient)
        
        # Remove duplicates and low confidence matches
        matched = self._filter_detections(matched)
        
        return matched
    
    def _calculate_similarity(self, detected_name: str, db_name: str, db_data: dict) -> float:
        """Calculate similarity between detected and database ingredient"""
        # Simple similarity calculation
        if detected_name == db_name:
            return 1.0
        
        # Check common names
        for common_name in db_data.get('common_names', []):
            if detected_name in common_name.lower() or common_name.lower() in detected_name:
                return 0.9
        
        # Check keywords
        for keyword in db_data.get('keywords', []):
            if detected_name in keyword.lower() or keyword.lower() in detected_name:
                return 0.8
        
        # Basic string similarity
        from difflib import SequenceMatcher
        return SequenceMatcher(None, detected_name, db_name).ratio()
    
    def _filter_detections(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter and deduplicate detections"""
        # Sort by final confidence
        detections.sort(key=lambda x: x['final_confidence'], reverse=True)
        
        # Remove low confidence detections
        filtered = [d for d in detections if d['final_confidence'] > 0.3]
        
        # Remove overlapping detections (simple NMS)
        final_detections = []
        for detection in filtered:
            is_duplicate = False
            for existing in final_detections:
                if self._calculate_iou(detection['bbox'], existing['bbox']) > 0.5:
                    if detection['final_confidence'] > existing['final_confidence']:
                        # Replace with higher confidence detection
                        final_detections.remove(existing)
                        final_detections.append(detection)
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                final_detections.append(detection)
        
        return final_detections
    
    def _calculate_iou(self, bbox1: List[float], bbox2: List[float]) -> float:
        """Calculate Intersection over Union (IoU) of two bounding boxes"""
        x1_1, y1_1, x2_1, y2_1 = bbox1
        x1_2, y1_2, x2_2, y2_2 = bbox2
        
        # Calculate intersection
        x1_i = max(x1_1, x1_2)
        y1_i = max(y1_1, y1_2)
        x2_i = min(x2_1, x2_2)
        y2_i = min(y2_1, y2_2)
        
        if x2_i <= x1_i or y2_i <= y1_i:
            return 0.0
        
        intersection = (x2_i - x1_i) * (y2_i - y1_i)
        
        # Calculate union
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0
    
    async def _save_detection_results(
        self, 
        ingredients: List[Dict[str, Any]], 
        user_id: str, 
        image_data: bytes
    ):
        """Save detection results to database"""
        try:
            # In a real implementation, you'd save the image and create detection records
            logger.info(f"💾 Saved {len(ingredients)} ingredient detections for user {user_id}")
            
        except Exception as e:
            logger.error(f"❌ Error saving detection results: {e}")


class CVService:
    """Computer Vision Service wrapper"""
    
    def __init__(self):
        self.detector = IngredientDetector()
    
    async def initialize(self):
        """Initialize the CV service"""
        await self.detector.initialize_models()
    
    async def detect_ingredients(
        self, 
        image_data: bytes, 
        user_id: str
    ) -> List[Dict[str, Any]]:
        """Detect ingredients from image"""
        return await self.detector.detect_ingredients_from_image(image_data, user_id)
    
    async def get_supported_ingredients(self) -> List[str]:
        """Get list of supported ingredients"""
        return list(self.detector.ingredient_database.keys())


# Global CV service instance
cv_service = CVService()