/**
 * Recipe Routes
 * 
 * API routes for recipe management, generation, and analysis.
 * Includes CRUD operations, AI generation, nutrition analysis,
 * and social features.
 */

const express = require('express');
const multer = require('multer');
const { body, param, query } = require('express-validator');
const path = require('path');
const fs = require('fs-extra');

// Models
const Recipe = require('../models/Recipe');
const User = require('../models/User');

// Services
const AIService = require('../services/aiService');
const VisionService = require('../services/visionService');
const NutritionService = require('../services/nutritionService');

// Middleware
const { 
  authenticate, 
  optionalAuth, 
  authorize, 
  authorizeOwnership,
  checkSubscriptionLimits,
  logActivity
} = require('../middleware/auth');
const { 
  catchAsync, 
  validationError, 
  notFoundError,
  forbiddenError 
} = require('../middleware/errorHandler');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/recipes');
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `recipe-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  }
});

/**
 * @route   GET /api/recipes
 * @desc    Get all recipes with filtering, sorting, and pagination
 * @access  Public
 */
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isLength({ min: 1, max: 100 }),
    query('cuisine').optional().isIn(['italian', 'chinese', 'mexican', 'indian', 'thai', 'french', 'mediterranean', 'american']),
    query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
    query('maxTime').optional().isInt({ min: 1, max: 300 }),
    query('maxCost').optional().isFloat({ min: 0 }),
    query('dietaryRestrictions').optional(),
    query('sort').optional().isIn(['newest', 'popular', 'rating', 'time', 'cost'])
  ],
  optionalAuth,
  catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      search,
      cuisine,
      difficulty,
      maxTime,
      maxCost,
      dietaryRestrictions,
      sort = 'newest'
    } = req.query;

    // Build query
    const query = { status: 'published', isPublic: true };

    // Search by title, description, or tags
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by cuisine
    if (cuisine) {
      query.cuisine = cuisine;
    }

    // Filter by difficulty
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Filter by max cooking time
    if (maxTime) {
      query['timing.total'] = { $lte: parseInt(maxTime) };
    }

    // Filter by max cost per serving
    if (maxCost) {
      query['costAnalysis.perServing'] = { $lte: parseFloat(maxCost) };
    }

    // Filter by dietary restrictions
    if (dietaryRestrictions) {
      const restrictions = Array.isArray(dietaryRestrictions) 
        ? dietaryRestrictions 
        : [dietaryRestrictions];
      query['nutrition.dietaryFlags'] = { $all: restrictions };
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'popular':
        sortOptions = { 'stats.views': -1, 'stats.saves': -1 };
        break;
      case 'rating':
        sortOptions = { averageRating: -1, totalRatings: -1 };
        break;
      case 'time':
        sortOptions = { 'timing.total': 1 };
        break;
      case 'cost':
        sortOptions = { 'costAnalysis.perServing': 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [recipes, total] = await Promise.all([
      Recipe.find(query)
        .populate('creator', 'username avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Recipe.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        recipes,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecipes: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
  })
);

/**
 * @route   GET /api/recipes/trending
 * @desc    Get trending recipes
 * @access  Public
 */
router.get('/trending',
  optionalAuth,
  catchAsync(async (req, res) => {
    const recipes = await Recipe.find({
      status: 'published',
      isPublic: true,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
      .populate('creator', 'username avatar')
      .sort({ 'stats.views': -1, 'stats.saves': -1, averageRating: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: { recipes }
    });
  })
);

/**
 * @route   GET /api/recipes/featured
 * @desc    Get featured recipes
 * @access  Public
 */
router.get('/featured',
  optionalAuth,
  catchAsync(async (req, res) => {
    const recipes = await Recipe.find({
      status: 'published',
      isPublic: true,
      featured: true
    })
      .populate('creator', 'username avatar')
      .sort({ averageRating: -1, 'stats.views': -1 })
      .limit(6)
      .lean();

    res.json({
      success: true,
      data: { recipes }
    });
  })
);

/**
 * @route   GET /api/recipes/my
 * @desc    Get user's recipes
 * @access  Private
 */
router.get('/my',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['draft', 'published', 'private', 'archived'])
  ],
  catchAsync(async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    
    const query = { creator: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [recipes, total] = await Promise.all([
      Recipe.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Recipe.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        recipes,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecipes: total,
          limit: parseInt(limit)
        }
      }
    });
  })
);

/**
 * @route   GET /api/recipes/:id
 * @desc    Get single recipe by ID
 * @access  Public
 */
router.get('/:id',
  [param('id').isMongoId()],
  optionalAuth,
  catchAsync(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id)
      .populate('creator', 'username avatar')
      .populate('ratings.user', 'username avatar');

    if (!recipe) {
      throw notFoundError('Recipe');
    }

    // Check if user can view this recipe
    const canView = recipe.isPublic || 
                   (req.user && req.user._id.equals(recipe.creator._id)) ||
                   (req.user && req.user.role === 'admin');

    if (!canView) {
      throw forbiddenError('Recipe is private');
    }

    // Increment view count if not the creator
    if (!req.user || !req.user._id.equals(recipe.creator._id)) {
      await recipe.incrementViews();
    }

    res.json({
      success: true,
      data: { recipe }
    });
  })
);

/**
 * @route   POST /api/recipes/generate
 * @desc    Generate recipe from ingredients
 * @access  Private
 */
router.post('/generate',
  authenticate,
  checkSubscriptionLimits('ai_requests_per_month'),
  logActivity('generate_recipe'),
  [
    body('ingredients').isArray({ min: 1 }).withMessage('At least one ingredient is required'),
    body('ingredients.*.name').notEmpty().withMessage('Ingredient name is required'),
    body('preferences.cuisine').optional().isIn(['italian', 'chinese', 'mexican', 'indian', 'thai', 'french', 'mediterranean', 'american']),
    body('preferences.difficulty').optional().isIn(['easy', 'medium', 'hard']),
    body('preferences.maxTime').optional().isInt({ min: 10, max: 300 }),
    body('preferences.servings').optional().isInt({ min: 1, max: 12 }),
    body('preferences.budgetMode').optional().isBoolean(),
    body('preferences.dietaryRestrictions').optional().isArray()
  ],
  catchAsync(async (req, res) => {
    const { ingredients, preferences = {} } = req.body;

    // Generate recipe using AI service
    const recipe = await AIService.generateRecipeFromIngredients(ingredients, {
      ...preferences,
      userId: req.user._id
    });

    // Analyze nutrition
    const nutrition = await NutritionService.analyzeRecipeNutrition(recipe);
    recipe.nutrition = nutrition;

    // Create recipe in database
    const newRecipe = new Recipe({
      ...recipe,
      creator: req.user._id,
      sourceIngredients: ingredients.map(ing => ing.name),
      status: 'draft'
    });

    await newRecipe.save();

    // Update user stats
    req.user.stats.recipesGenerated += 1;
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Recipe generated successfully',
      data: { recipe: newRecipe }
    });
  })
);

/**
 * @route   POST /api/recipes/generate-from-image
 * @desc    Generate recipe from fridge image
 * @access  Private
 */
router.post('/generate-from-image',
  authenticate,
  checkSubscriptionLimits('images_per_month'),
  logActivity('generate_recipe_from_image'),
  upload.single('image'),
  [
    body('preferences.cuisine').optional().isIn(['italian', 'chinese', 'mexican', 'indian', 'thai', 'french', 'mediterranean', 'american']),
    body('preferences.difficulty').optional().isIn(['easy', 'medium', 'hard']),
    body('preferences.maxTime').optional().isInt({ min: 10, max: 300 }),
    body('preferences.budgetMode').optional().isBoolean()
  ],
  catchAsync(async (req, res) => {
    if (!req.file) {
      throw validationError('Image file is required');
    }

    const { preferences = {} } = req.body;
    const imagePath = req.file.path;

    try {
      // Validate image
      await VisionService.validateImage(imagePath);

      // Detect ingredients from image
      const detectedIngredients = await VisionService.detectIngredientsFromImage(imagePath);

      if (detectedIngredients.length === 0) {
        throw validationError('No ingredients detected in the image. Please try a clearer photo.');
      }

      // Generate recipe from detected ingredients
      const recipe = await AIService.generateRecipeFromIngredients(detectedIngredients, {
        ...preferences,
        userId: req.user._id
      });

      // Analyze nutrition
      const nutrition = await NutritionService.analyzeRecipeNutrition(recipe);
      recipe.nutrition = nutrition;

      // Create recipe in database
      const newRecipe = new Recipe({
        ...recipe,
        creator: req.user._id,
        sourceIngredients: detectedIngredients.map(ing => ing.name),
        generatedFrom: 'image',
        status: 'draft'
      });

      await newRecipe.save();

      // Update user stats
      req.user.stats.recipesGenerated += 1;
      req.user.stats.photosUploaded += 1;
      await req.user.save();

      res.status(201).json({
        success: true,
        message: 'Recipe generated successfully from image',
        data: {
          recipe: newRecipe,
          detectedIngredients
        }
      });

    } finally {
      // Clean up uploaded file
      await VisionService.cleanup([imagePath]);
    }
  })
);

/**
 * @route   POST /api/recipes
 * @desc    Create new recipe manually
 * @access  Private
 */
router.post('/',
  authenticate,
  upload.array('images', 5),
  [
    body('title').notEmpty().isLength({ min: 3, max: 200 }),
    body('description').optional().isLength({ max: 1000 }),
    body('cuisine').optional().isIn(['italian', 'chinese', 'mexican', 'indian', 'thai', 'french', 'mediterranean', 'american']),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
    body('timing.prep').isInt({ min: 0 }),
    body('timing.cook').isInt({ min: 0 }),
    body('servings.count').isInt({ min: 1, max: 50 }),
    body('ingredients').isArray({ min: 1 }),
    body('instructions').isArray({ min: 1 })
  ],
  catchAsync(async (req, res) => {
    const recipeData = req.body;

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      recipeData.images = req.files.map((file, index) => ({
        url: `/uploads/recipes/${file.filename}`,
        caption: `Recipe image ${index + 1}`,
        isPrimary: index === 0
      }));
    }

    // Set creator
    recipeData.creator = req.user._id;
    recipeData.source = 'user-created';

    // Analyze nutrition if ingredients are provided
    if (recipeData.ingredients && recipeData.ingredients.length > 0) {
      const nutrition = await NutritionService.analyzeRecipeNutrition(recipeData);
      recipeData.nutrition = nutrition;
    }

    const recipe = new Recipe(recipeData);
    await recipe.save();

    // Update user stats
    req.user.stats.recipesGenerated += 1;
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      data: { recipe }
    });
  })
);

/**
 * @route   PUT /api/recipes/:id
 * @desc    Update recipe
 * @access  Private (Owner or Admin)
 */
router.put('/:id',
  authenticate,
  [param('id').isMongoId()],
  upload.array('newImages', 5),
  catchAsync(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      throw notFoundError('Recipe');
    }

    // Check ownership
    if (!recipe.creator.equals(req.user._id) && req.user.role !== 'admin') {
      throw forbiddenError('You can only edit your own recipes');
    }

    const updateData = req.body;

    // Handle new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: `/uploads/recipes/${file.filename}`,
        caption: `Recipe image ${index + 1}`,
        isPrimary: false
      }));
      
      updateData.images = [...(recipe.images || []), ...newImages];
    }

    // Re-analyze nutrition if ingredients changed
    if (updateData.ingredients) {
      const nutrition = await NutritionService.analyzeRecipeNutrition({
        ...recipe.toObject(),
        ...updateData
      });
      updateData.nutrition = nutrition;
    }

    // Update recipe
    Object.assign(recipe, updateData);
    await recipe.save();

    res.json({
      success: true,
      message: 'Recipe updated successfully',
      data: { recipe }
    });
  })
);

/**
 * @route   DELETE /api/recipes/:id
 * @desc    Delete recipe
 * @access  Private (Owner or Admin)
 */
router.delete('/:id',
  authenticate,
  [param('id').isMongoId()],
  catchAsync(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      throw notFoundError('Recipe');
    }

    // Check ownership
    if (!recipe.creator.equals(req.user._id) && req.user.role !== 'admin') {
      throw forbiddenError('You can only delete your own recipes');
    }

    // Clean up uploaded images
    if (recipe.images && recipe.images.length > 0) {
      const imagePaths = recipe.images
        .filter(img => img.url.startsWith('/uploads/'))
        .map(img => path.join(__dirname, '..', img.url));
      
      await VisionService.cleanup(imagePaths);
    }

    await recipe.deleteOne();

    res.json({
      success: true,
      message: 'Recipe deleted successfully'
    });
  })
);

/**
 * @route   POST /api/recipes/:id/rate
 * @desc    Rate a recipe
 * @access  Private
 */
router.post('/:id/rate',
  authenticate,
  [
    param('id').isMongoId(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('review').optional().isLength({ max: 500 })
  ],
  catchAsync(async (req, res) => {
    const { rating, review } = req.body;
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      throw notFoundError('Recipe');
    }

    // Can't rate your own recipe
    if (recipe.creator.equals(req.user._id)) {
      throw validationError('You cannot rate your own recipe');
    }

    await recipe.addRating(req.user._id, rating, review);

    res.json({
      success: true,
      message: 'Rating added successfully',
      data: {
        averageRating: recipe.averageRating,
        totalRatings: recipe.totalRatings
      }
    });
  })
);

/**
 * @route   POST /api/recipes/:id/save
 * @desc    Save/unsave recipe to favorites
 * @access  Private
 */
router.post('/:id/save',
  authenticate,
  [param('id').isMongoId()],
  catchAsync(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      throw notFoundError('Recipe');
    }

    await req.user.toggleFavorite(req.params.id);
    await recipe.incrementSaves();

    const isSaved = req.user.favoriteRecipes.includes(req.params.id);

    res.json({
      success: true,
      message: isSaved ? 'Recipe saved to favorites' : 'Recipe removed from favorites',
      data: { isSaved }
    });
  })
);

/**
 * @route   POST /api/recipes/:id/cooked
 * @desc    Mark recipe as cooked
 * @access  Private
 */
router.post('/:id/cooked',
  authenticate,
  [
    param('id').isMongoId(),
    body('notes').optional().isLength({ max: 500 }),
    body('modifications').optional().isArray()
  ],
  catchAsync(async (req, res) => {
    const { notes, modifications } = req.body;
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      throw notFoundError('Recipe');
    }

    // Add to user's history
    await req.user.addToHistory(req.params.id, null, notes);

    // Update recipe stats
    await recipe.markAsCooked();

    // Update user stats
    req.user.stats.recipesCooked += 1;
    await req.user.save();

    res.json({
      success: true,
      message: 'Recipe marked as cooked',
      data: { cookedCount: recipe.stats.cooked }
    });
  })
);

/**
 * @route   GET /api/recipes/:id/nutrition
 * @desc    Get detailed nutrition analysis for recipe
 * @access  Public
 */
router.get('/:id/nutrition',
  [param('id').isMongoId()],
  optionalAuth,
  catchAsync(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      throw notFoundError('Recipe');
    }

    // Check if user can view this recipe
    const canView = recipe.isPublic || 
                   (req.user && req.user._id.equals(recipe.creator)) ||
                   (req.user && req.user.role === 'admin');

    if (!canView) {
      throw forbiddenError('Recipe is private');
    }

    // Get or recalculate nutrition
    let nutrition = recipe.nutrition;
    
    if (!nutrition || req.query.recalculate === 'true') {
      nutrition = await NutritionService.analyzeRecipeNutrition(recipe);
      recipe.nutrition = nutrition;
      await recipe.save();
    }

    res.json({
      success: true,
      data: { nutrition }
    });
  })
);

/**
 * @route   GET /api/recipes/search/ingredients
 * @desc    Search recipes by ingredients
 * @access  Public
 */
router.get('/search/ingredients',
  [
    query('ingredients').notEmpty(),
    query('minMatch').optional().isInt({ min: 1 }),
    query('maxTime').optional().isInt({ min: 1 }),
    query('maxCost').optional().isFloat({ min: 0 }),
    query('dietaryRestrictions').optional(),
    query('cuisine').optional(),
    query('difficulty').optional()
  ],
  optionalAuth,
  catchAsync(async (req, res) => {
    const { ingredients, ...options } = req.query;
    
    const ingredientList = ingredients.split(',').map(ing => ing.trim());
    
    const recipes = await Recipe.findByIngredients(ingredientList, options);

    res.json({
      success: true,
      data: { recipes }
    });
  })
);

/**
 * @route   GET /api/recipes/budget/friendly
 * @desc    Get budget-friendly recipes
 * @access  Public
 */
router.get('/budget/friendly',
  [query('maxCost').optional().isFloat({ min: 0, max: 50 })],
  optionalAuth,
  catchAsync(async (req, res) => {
    const maxCostPerServing = parseFloat(req.query.maxCost) || 5;
    
    const recipes = await Recipe.findBudgetFriendly(maxCostPerServing);

    res.json({
      success: true,
      data: { recipes }
    });
  })
);

module.exports = router;