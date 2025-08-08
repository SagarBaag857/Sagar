/**
 * Recipe Model
 * 
 * Represents a recipe in the AI Recipe Generator application.
 * Includes detailed recipe information, nutrition analysis,
 * cost breakdown, and user interactions.
 */

const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ingredient name is required'],
    trim: true
  },
  
  quantity: {
    type: Number,
    required: [true, 'Ingredient quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  
  unit: {
    type: String,
    required: [true, 'Ingredient unit is required'],
    enum: [
      'cup', 'cups', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons',
      'pound', 'pounds', 'ounce', 'ounces', 'gram', 'grams', 'kilogram', 'kilograms',
      'liter', 'liters', 'milliliter', 'milliliters', 'pint', 'pints', 'quart', 'quarts',
      'gallon', 'gallons', 'piece', 'pieces', 'slice', 'slices', 'clove', 'cloves',
      'bunch', 'bunches', 'package', 'packages', 'can', 'cans', 'bottle', 'bottles',
      'to taste', 'as needed', 'whole', 'half', 'quarter'
    ]
  },
  
  category: {
    type: String,
    enum: [
      'proteins', 'vegetables', 'fruits', 'grains', 'dairy', 'spices',
      'herbs', 'oils', 'condiments', 'nuts', 'legumes', 'beverages', 'other'
    ],
    default: 'other'
  },
  
  optional: {
    type: Boolean,
    default: false
  },
  
  substitutes: [{
    name: String,
    ratio: {
      type: String,
      default: '1:1'
    }
  }],
  
  // Cost information
  cost: {
    estimated: {
      type: Number,
      min: 0
    },
    
    currency: {
      type: String,
      default: 'USD'
    },
    
    pricePerUnit: Number,
    
    source: {
      type: String,
      enum: ['database', 'api', 'estimated', 'user'],
      default: 'estimated'
    }
  },
  
  // Nutrition per ingredient
  nutrition: {
    calories: Number,
    protein: Number, // grams
    carbs: Number,   // grams
    fat: Number,     // grams
    fiber: Number,   // grams
    sugar: Number,   // grams
    sodium: Number,  // milligrams
    cholesterol: Number, // milligrams
    vitamins: [{
      name: String,
      amount: Number,
      unit: String
    }],
    minerals: [{
      name: String,
      amount: Number,
      unit: String
    }]
  }
});

const instructionSchema = new mongoose.Schema({
  step: {
    type: Number,
    required: [true, 'Step number is required'],
    min: 1
  },
  
  instruction: {
    type: String,
    required: [true, 'Instruction text is required'],
    trim: true
  },
  
  duration: {
    type: Number, // in minutes
    min: 0
  },
  
  temperature: {
    value: Number,
    unit: {
      type: String,
      enum: ['F', 'C'],
      default: 'F'
    }
  },
  
  equipment: [String],
  
  tips: [String],
  
  images: [String], // URLs to step images
  
  warnings: [String] // Safety warnings or important notes
});

const nutritionSchema = new mongoose.Schema({
  perServing: {
    calories: {
      type: Number,
      min: 0
    },
    
    macros: {
      protein: { type: Number, min: 0 }, // grams
      carbs: { type: Number, min: 0 },   // grams
      fat: { type: Number, min: 0 }      // grams
    },
    
    micronutrients: {
      fiber: { type: Number, min: 0 },        // grams
      sugar: { type: Number, min: 0 },        // grams
      sodium: { type: Number, min: 0 },       // milligrams
      cholesterol: { type: Number, min: 0 },  // milligrams
      potassium: { type: Number, min: 0 },    // milligrams
      calcium: { type: Number, min: 0 },      // milligrams
      iron: { type: Number, min: 0 },         // milligrams
      vitaminA: { type: Number, min: 0 },     // IU
      vitaminC: { type: Number, min: 0 },     // milligrams
      vitaminD: { type: Number, min: 0 },     // IU
      vitaminE: { type: Number, min: 0 },     // milligrams
      vitaminK: { type: Number, min: 0 },     // micrograms
      vitaminB6: { type: Number, min: 0 },    // milligrams
      vitaminB12: { type: Number, min: 0 },   // micrograms
      folate: { type: Number, min: 0 },       // micrograms
      niacin: { type: Number, min: 0 },       // milligrams
      riboflavin: { type: Number, min: 0 },   // milligrams
      thiamin: { type: Number, min: 0 }       // milligrams
    }
  },
  
  total: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  
  healthScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  dietaryFlags: [{
    type: String,
    enum: [
      'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
      'nut-free', 'egg-free', 'soy-free', 'shellfish-free',
      'kosher', 'halal', 'paleo', 'keto', 'low-carb',
      'low-fat', 'low-sodium', 'high-protein', 'high-fiber'
    ]
  }],
  
  allergens: [String],
  
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  
  source: {
    type: String,
    enum: ['calculated', 'api', 'manual'],
    default: 'calculated'
  }
});

const costAnalysisSchema = new mongoose.Schema({
  total: {
    estimated: {
      type: Number,
      min: 0
    },
    
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  perServing: {
    type: Number,
    min: 0
  },
  
  breakdown: [{
    category: String,
    amount: Number,
    percentage: Number
  }],
  
  budgetFriendly: {
    type: Boolean,
    default: false
  },
  
  savingsOpportunities: [{
    suggestion: String,
    potentialSavings: Number
  }],
  
  calculatedAt: {
    type: Date,
    default: Date.now
  }
});

const recipeSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Recipe title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  cuisine: {
    type: String,
    enum: [
      'american', 'italian', 'mexican', 'chinese', 'japanese',
      'indian', 'thai', 'french', 'mediterranean', 'middle-eastern',
      'korean', 'vietnamese', 'greek', 'spanish', 'british', 'fusion'
    ]
  },
  
  category: {
    type: String,
    enum: [
      'breakfast', 'lunch', 'dinner', 'snack', 'dessert',
      'appetizer', 'main-course', 'side-dish', 'soup', 'salad',
      'beverage', 'sauce', 'condiment', 'bread', 'pasta'
    ]
  },
  
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  
  // Timing Information
  timing: {
    prep: {
      type: Number, // minutes
      required: [true, 'Prep time is required'],
      min: [0, 'Prep time cannot be negative']
    },
    
    cook: {
      type: Number, // minutes
      required: [true, 'Cook time is required'],
      min: [0, 'Cook time cannot be negative']
    },
    
    total: {
      type: Number, // minutes
      min: [0, 'Total time cannot be negative']
    },
    
    inactive: {
      type: Number, // minutes (marinating, chilling, etc.)
      default: 0
    }
  },
  
  // Serving Information
  servings: {
    count: {
      type: Number,
      required: [true, 'Serving count is required'],
      min: [1, 'Must serve at least 1 person'],
      max: [50, 'Cannot serve more than 50 people']
    },
    
    size: String // e.g., "1 cup", "2 pieces"
  },
  
  // Recipe Content
  ingredients: {
    type: [ingredientSchema],
    required: [true, 'At least one ingredient is required'],
    validate: {
      validator: function(ingredients) {
        return ingredients && ingredients.length > 0;
      },
      message: 'Recipe must have at least one ingredient'
    }
  },
  
  instructions: {
    type: [instructionSchema],
    required: [true, 'At least one instruction is required'],
    validate: {
      validator: function(instructions) {
        return instructions && instructions.length > 0;
      },
      message: 'Recipe must have at least one instruction'
    }
  },
  
  // Equipment and Tools
  equipment: [{
    name: String,
    essential: {
      type: Boolean,
      default: true
    },
    alternatives: [String]
  }],
  
  // Media
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  video: {
    url: String,
    duration: Number, // seconds
    thumbnail: String
  },
  
  // Nutritional Information
  nutrition: nutritionSchema,
  
  // Cost Analysis
  costAnalysis: costAnalysisSchema,
  
  // Recipe Generation Information
  generatedFrom: {
    type: String,
    enum: ['image', 'ingredients-list', 'manual', 'ai-suggestion'],
    default: 'manual'
  },
  
  sourceIngredients: [String], // Original ingredients detected from image/list
  
  generationPrompt: String, // AI prompt used to generate recipe
  
  aiModel: String, // AI model used for generation
  
  // Creator and Attribution
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  source: {
    type: String,
    enum: ['user-created', 'ai-generated', 'imported', 'community'],
    default: 'ai-generated'
  },
  
  originalSource: {
    url: String,
    name: String,
    attribution: String
  },
  
  // Social and Interaction Data
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    
    review: String,
    
    helpful: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  totalRatings: {
    type: Number,
    default: 0
  },
  
  // Usage Statistics
  stats: {
    views: {
      type: Number,
      default: 0
    },
    
    saves: {
      type: Number,
      default: 0
    },
    
    shares: {
      type: Number,
      default: 0
    },
    
    cooked: {
      type: Number,
      default: 0
    }
  },
  
  // Recipe Variations
  variations: [{
    name: String,
    description: String,
    modifications: [String],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Tags and Categories
  tags: [String],
  
  seasonal: [{
    type: String,
    enum: ['spring', 'summer', 'fall', 'winter']
  }],
  
  occasions: [{
    type: String,
    enum: [
      'everyday', 'weekend', 'holiday', 'party', 'date-night',
      'family-dinner', 'meal-prep', 'potluck', 'bbq', 'picnic'
    ]
  }],
  
  // Publication Status
  status: {
    type: String,
    enum: ['draft', 'published', 'private', 'archived'],
    default: 'published'
  },
  
  isPublic: {
    type: Boolean,
    default: true
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  // Quality Assurance
  verified: {
    type: Boolean,
    default: false
  },
  
  qualityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  flags: [{
    type: {
      type: String,
      enum: ['inappropriate', 'inaccurate', 'spam', 'copyright']
    },
    reason: String,
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
recipeSchema.index({ title: 'text', description: 'text', tags: 'text' });
recipeSchema.index({ cuisine: 1, category: 1 });
recipeSchema.index({ 'timing.total': 1 });
recipeSchema.index({ averageRating: -1 });
recipeSchema.index({ 'stats.views': -1 });
recipeSchema.index({ createdAt: -1 });
recipeSchema.index({ creator: 1 });
recipeSchema.index({ 'nutrition.dietaryFlags': 1 });
recipeSchema.index({ 'costAnalysis.perServing': 1 });

// Virtual for total time calculation
recipeSchema.virtual('totalTime').get(function() {
  return this.timing.prep + this.timing.cook;
});

// Virtual for cost per serving
recipeSchema.virtual('costPerServing').get(function() {
  return this.costAnalysis?.perServing || 0;
});

// Pre-save middleware to calculate total time
recipeSchema.pre('save', function(next) {
  if (this.timing.prep !== undefined && this.timing.cook !== undefined) {
    this.timing.total = this.timing.prep + this.timing.cook + (this.timing.inactive || 0);
  }
  next();
});

// Method to add rating
recipeSchema.methods.addRating = function(userId, rating, review = '') {
  // Remove existing rating from this user
  this.ratings = this.ratings.filter(r => !r.user.equals(userId));
  
  // Add new rating
  this.ratings.push({
    user: userId,
    rating,
    review
  });
  
  // Recalculate average rating
  this.calculateAverageRating();
  
  return this.save();
};

// Method to calculate average rating
recipeSchema.methods.calculateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
    return;
  }
  
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
  this.totalRatings = this.ratings.length;
};

// Method to increment view count
recipeSchema.methods.incrementViews = function() {
  this.stats.views += 1;
  return this.save();
};

// Method to increment save count
recipeSchema.methods.incrementSaves = function() {
  this.stats.saves += 1;
  return this.save();
};

// Method to increment share count
recipeSchema.methods.incrementShares = function() {
  this.stats.shares += 1;
  return this.save();
};

// Method to mark as cooked
recipeSchema.methods.markAsCooked = function() {
  this.stats.cooked += 1;
  return this.save();
};

// Method to calculate quality score
recipeSchema.methods.calculateQualityScore = function() {
  let score = 0;
  
  // Basic completeness (40 points)
  if (this.title) score += 5;
  if (this.description) score += 5;
  if (this.ingredients.length > 0) score += 10;
  if (this.instructions.length > 0) score += 10;
  if (this.images.length > 0) score += 5;
  if (this.nutrition) score += 5;
  
  // Detail quality (30 points)
  if (this.timing.prep && this.timing.cook) score += 10;
  if (this.equipment.length > 0) score += 5;
  if (this.tags.length > 0) score += 5;
  if (this.costAnalysis) score += 10;
  
  // User engagement (30 points)
  if (this.averageRating > 4) score += 15;
  else if (this.averageRating > 3) score += 10;
  else if (this.averageRating > 2) score += 5;
  
  if (this.stats.views > 100) score += 5;
  if (this.stats.cooked > 10) score += 5;
  if (this.verified) score += 5;
  
  this.qualityScore = Math.min(score, 100);
  return this.qualityScore;
};

// Static method to find recipes by ingredients
recipeSchema.statics.findByIngredients = function(ingredientNames, options = {}) {
  const {
    minMatch = 1,
    maxTime,
    maxCost,
    dietaryRestrictions = [],
    cuisine,
    difficulty
  } = options;
  
  const query = {
    'ingredients.name': {
      $in: ingredientNames.map(name => new RegExp(name, 'i'))
    }
  };
  
  if (maxTime) {
    query['timing.total'] = { $lte: maxTime };
  }
  
  if (maxCost) {
    query['costAnalysis.perServing'] = { $lte: maxCost };
  }
  
  if (dietaryRestrictions.length > 0) {
    query['nutrition.dietaryFlags'] = { $all: dietaryRestrictions };
  }
  
  if (cuisine) {
    query.cuisine = cuisine;
  }
  
  if (difficulty) {
    query.difficulty = difficulty;
  }
  
  return this.find(query)
    .populate('creator', 'username avatar')
    .sort({ averageRating: -1, 'stats.views': -1 });
};

// Static method for budget-friendly recipes
recipeSchema.statics.findBudgetFriendly = function(maxCostPerServing = 5) {
  return this.find({
    'costAnalysis.perServing': { $lte: maxCostPerServing },
    'costAnalysis.budgetFriendly': true
  })
    .sort({ 'costAnalysis.perServing': 1, averageRating: -1 });
};

module.exports = mongoose.model('Recipe', recipeSchema);