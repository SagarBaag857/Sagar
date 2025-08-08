/**
 * User Model
 * 
 * Represents a user in the AI Recipe Generator application.
 * Includes authentication, dietary preferences, budget settings,
 * and recipe history tracking.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Basic Information
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  
  avatar: {
    type: String,
    default: null
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  role: {
    type: String,
    enum: ['user', 'premium', 'admin'],
    default: 'user'
  },
  
  // Dietary Preferences
  dietaryPreferences: {
    restrictions: [{
      type: String,
      enum: [
        'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
        'nut-free', 'egg-free', 'soy-free', 'shellfish-free',
        'kosher', 'halal', 'paleo', 'keto', 'low-carb'
      ]
    }],
    
    allergies: [{
      type: String,
      trim: true
    }],
    
    cuisinePreferences: [{
      type: String,
      enum: [
        'american', 'italian', 'mexican', 'chinese', 'japanese',
        'indian', 'thai', 'french', 'mediterranean', 'middle-eastern',
        'korean', 'vietnamese', 'greek', 'spanish', 'british'
      ]
    }],
    
    spiceLevel: {
      type: String,
      enum: ['mild', 'medium', 'hot', 'very-hot'],
      default: 'medium'
    },
    
    cookingTime: {
      preferred: {
        type: Number, // in minutes
        default: 30
      },
      maximum: {
        type: Number, // in minutes
        default: 60
      }
    },
    
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  },
  
  // Budget Settings
  budgetSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    
    monthlyBudget: {
      type: Number,
      min: [0, 'Budget cannot be negative'],
      default: 0
    },
    
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR']
    },
    
    prioritizeDeals: {
      type: Boolean,
      default: true
    },
    
    maxCostPerServing: {
      type: Number,
      min: [0, 'Cost per serving cannot be negative'],
      default: 10
    }
  },
  
  // Nutrition Goals
  nutritionGoals: {
    dailyCalories: {
      type: Number,
      min: [1000, 'Daily calories must be at least 1000'],
      max: [5000, 'Daily calories cannot exceed 5000']
    },
    
    macros: {
      protein: { type: Number, min: 0, max: 100 }, // percentage
      carbs: { type: Number, min: 0, max: 100 },   // percentage
      fat: { type: Number, min: 0, max: 100 }      // percentage
    },
    
    trackNutrition: {
      type: Boolean,
      default: false
    }
  },
  
  // Recipe History and Preferences
  recipeHistory: [{
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe'
    },
    
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    
    notes: String,
    
    cooked: {
      type: Boolean,
      default: false
    },
    
    cookedAt: Date,
    
    viewedAt: {
      type: Date,
      default: Date.now
    },
    
    modifications: [String]
  }],
  
  // Favorite Recipes
  favoriteRecipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }],
  
  // Shopping Lists
  shoppingLists: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    
    ingredients: [{
      name: String,
      quantity: String,
      unit: String,
      category: String,
      purchased: {
        type: Boolean,
        default: false
      }
    }],
    
    createdAt: {
      type: Date,
      default: Date.now
    },
    
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // App Usage Statistics
  stats: {
    recipesGenerated: {
      type: Number,
      default: 0
    },
    
    recipesCooked: {
      type: Number,
      default: 0
    },
    
    photosUploaded: {
      type: Number,
      default: 0
    },
    
    totalSavings: {
      type: Number,
      default: 0
    },
    
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  
  // Notification Preferences
  notifications: {
    email: {
      recipeRecommendations: {
        type: Boolean,
        default: true
      },
      
      weeklyMealPlan: {
        type: Boolean,
        default: false
      },
      
      budgetAlerts: {
        type: Boolean,
        default: true
      },
      
      newFeatures: {
        type: Boolean,
        default: true
      }
    },
    
    push: {
      enabled: {
        type: Boolean,
        default: false
      },
      
      mealReminders: {
        type: Boolean,
        default: false
      },
      
      shoppingReminders: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // Social Features
  social: {
    isPublic: {
      type: Boolean,
      default: false
    },
    
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    
    sharedRecipes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe'
    }]
  },
  
  // API Usage (for rate limiting)
  apiUsage: {
    monthly: {
      requests: {
        type: Number,
        default: 0
      },
      
      resetDate: {
        type: Date,
        default: () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      }
    },
    
    daily: {
      requests: {
        type: Number,
        default: 0
      },
      
      resetDate: {
        type: Date,
        default: () => new Date(Date.now() + 24*60*60*1000)
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'stats.lastActive': -1 });
userSchema.index({ 'recipeHistory.viewedAt': -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// Virtual for recipe count
userSchema.virtual('recipeCount').get(function() {
  return this.recipeHistory.length;
});

// Virtual for favorite count
userSchema.virtual('favoriteCount').get(function() {
  return this.favoriteRecipes.length;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      username: this.username,
      role: this.role 
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

// Method to add recipe to history
userSchema.methods.addToHistory = function(recipeId, rating = null, notes = '') {
  // Remove existing entry if it exists
  this.recipeHistory = this.recipeHistory.filter(
    item => !item.recipe.equals(recipeId)
  );
  
  // Add new entry at the beginning
  this.recipeHistory.unshift({
    recipe: recipeId,
    rating,
    notes,
    viewedAt: new Date()
  });
  
  // Keep only last 100 recipes
  if (this.recipeHistory.length > 100) {
    this.recipeHistory = this.recipeHistory.slice(0, 100);
  }
  
  return this.save();
};

// Method to toggle favorite recipe
userSchema.methods.toggleFavorite = function(recipeId) {
  const index = this.favoriteRecipes.findIndex(id => id.equals(recipeId));
  
  if (index > -1) {
    this.favoriteRecipes.splice(index, 1);
  } else {
    this.favoriteRecipes.push(recipeId);
  }
  
  return this.save();
};

// Method to update API usage
userSchema.methods.incrementAPIUsage = function() {
  const now = new Date();
  
  // Check if daily reset is needed
  if (now > this.apiUsage.daily.resetDate) {
    this.apiUsage.daily.requests = 0;
    this.apiUsage.daily.resetDate = new Date(now.getTime() + 24*60*60*1000);
  }
  
  // Check if monthly reset is needed
  if (now > this.apiUsage.monthly.resetDate) {
    this.apiUsage.monthly.requests = 0;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    this.apiUsage.monthly.resetDate = nextMonth;
  }
  
  this.apiUsage.daily.requests += 1;
  this.apiUsage.monthly.requests += 1;
  this.stats.lastActive = now;
  
  return this.save();
};

// Method to check API limits
userSchema.methods.hasExceededAPILimits = function() {
  const limits = {
    user: { daily: 50, monthly: 1000 },
    premium: { daily: 200, monthly: 5000 },
    admin: { daily: Infinity, monthly: Infinity }
  };
  
  const userLimits = limits[this.role] || limits.user;
  
  return (
    this.apiUsage.daily.requests >= userLimits.daily ||
    this.apiUsage.monthly.requests >= userLimits.monthly
  );
};

// Static method to find by email or username
userSchema.statics.findByCredentials = async function(identifier, password) {
  const user = await this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  }).select('+password');
  
  if (!user || !(await user.matchPassword(password))) {
    throw new Error('Invalid credentials');
  }
  
  return user;
};

module.exports = mongoose.model('User', userSchema);