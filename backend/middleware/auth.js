/**
 * Authentication Middleware
 * 
 * JWT-based authentication and authorization middleware for the
 * AI Recipe Generator API. Handles token verification, user
 * authentication, and role-based access control.
 */

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const { catchAsync, authError, forbiddenError } = require('./errorHandler');

/**
 * Verify JWT token and authenticate user
 */
const authenticate = catchAsync(async (req, res, next) => {
  // 1) Check if token exists
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token) {
    return next(authError('You are not logged in. Please log in to get access.'));
  }

  // 2) Verify token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(authError('Invalid token. Please log in again.'));
    } else if (error.name === 'TokenExpiredError') {
      return next(authError('Your token has expired. Please log in again.'));
    }
    return next(authError('Token verification failed.'));
  }

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id).select('+isActive');
  if (!currentUser) {
    return next(authError('The user belonging to this token no longer exists.'));
  }

  // 4) Check if user account is active
  if (!currentUser.isActive) {
    return next(authError('Your account has been deactivated. Please contact support.'));
  }

  // 5) Check if user has exceeded API limits
  if (currentUser.hasExceededAPILimits()) {
    return next(authError('API usage limit exceeded. Please upgrade your plan or try again later.'));
  }

  // 6) Update user's last active timestamp and increment API usage
  currentUser.incrementAPIUsage();

  // Grant access to protected route
  req.user = currentUser;
  next();
});

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id).select('+isActive');
    
    if (currentUser && currentUser.isActive) {
      req.user = currentUser;
    }
  } catch (error) {
    // Silently ignore authentication errors for optional auth
    console.warn('Optional authentication failed:', error.message);
  }

  next();
});

/**
 * Authorize user based on roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(authError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(forbiddenError('You do not have permission to perform this action'));
    }

    next();
  };
};

/**
 * Check if user owns the resource or is admin
 */
const authorizeOwnership = (resourceUserField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(authError('Authentication required'));
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resource = req.body || req.params;
    const resourceUserId = resource[resourceUserField] || resource.creator;

    if (!resourceUserId) {
      return next(forbiddenError('Resource ownership cannot be determined'));
    }

    if (resourceUserId.toString() !== req.user._id.toString()) {
      return next(forbiddenError('You can only access your own resources'));
    }

    next();
  };
};

/**
 * Rate limiting middleware for authenticated users
 */
const rateLimit = (limit = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart);
      requests.set(userId, userRequests);
    } else {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    // Check if limit exceeded
    if (userRequests.length >= limit) {
      return next(authError(`Rate limit exceeded. Maximum ${limit} requests per ${windowMs / 60000} minutes.`));
    }

    // Add current request
    userRequests.push(now);
    requests.set(userId, userRequests);

    next();
  };
};

/**
 * Verify email confirmation
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return next(authError('Authentication required'));
  }

  if (!req.user.isVerified) {
    return next(authError('Please verify your email address to access this feature'));
  }

  next();
};

/**
 * Check premium subscription
 */
const requirePremium = (req, res, next) => {
  if (!req.user) {
    return next(authError('Authentication required'));
  }

  if (!['premium', 'admin'].includes(req.user.role)) {
    return next(forbiddenError('This feature requires a premium subscription'));
  }

  next();
};

/**
 * API key authentication for external services
 */
const authenticateAPIKey = catchAsync(async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return next(authError('API key required'));
  }

  // In a real application, you would validate the API key against a database
  // For demo purposes, we'll use a simple check
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return next(authError('Invalid API key'));
  }

  // Set a system user for internal requests
  req.user = {
    _id: 'system',
    role: 'system',
    username: 'system'
  };

  next();
});

/**
 * Log user activity
 */
const logActivity = (action) => {
  return (req, res, next) => {
    if (req.user && req.user._id !== 'system') {
      // Log user activity - in production, this might go to a separate logging service
      console.log(`[${new Date().toISOString()}] User ${req.user.username} performed action: ${action}`);
      
      // You could also store this in the database
      // ActivityLog.create({
      //   user: req.user._id,
      //   action: action,
      //   ip: req.ip,
      //   userAgent: req.get('User-Agent'),
      //   timestamp: new Date()
      // });
    }
    next();
  };
};

/**
 * Validate user permissions for specific resources
 */
const validateResourcePermissions = (resourceType) => {
  return catchAsync(async (req, res, next) => {
    if (!req.user) {
      return next(authError('Authentication required'));
    }

    const resourceId = req.params.id;
    let resource;

    // Load the resource based on type
    switch (resourceType) {
      case 'recipe':
        const Recipe = require('../models/Recipe');
        resource = await Recipe.findById(resourceId);
        break;
      case 'user':
        resource = await User.findById(resourceId);
        break;
      default:
        return next(forbiddenError('Invalid resource type'));
    }

    if (!resource) {
      return next(forbiddenError('Resource not found'));
    }

    // Check permissions
    const isOwner = resource.creator && resource.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isPublic = resource.isPublic;

    // For read operations, allow if public or owned or admin
    if (req.method === 'GET' && (isPublic || isOwner || isAdmin)) {
      req.resource = resource;
      return next();
    }

    // For write operations, only allow owner or admin
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && (isOwner || isAdmin)) {
      req.resource = resource;
      return next();
    }

    return next(forbiddenError('Insufficient permissions to access this resource'));
  });
};

/**
 * Check user subscription limits
 */
const checkSubscriptionLimits = (feature) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(authError('Authentication required'));
    }

    const limits = {
      user: {
        recipes_per_month: 50,
        images_per_month: 20,
        ai_requests_per_month: 100
      },
      premium: {
        recipes_per_month: 500,
        images_per_month: 200,
        ai_requests_per_month: 1000
      },
      admin: {
        recipes_per_month: Infinity,
        images_per_month: Infinity,
        ai_requests_per_month: Infinity
      }
    };

    const userLimits = limits[req.user.role] || limits.user;
    const featureLimit = userLimits[feature];

    if (featureLimit === undefined) {
      return next(forbiddenError('Invalid feature'));
    }

    // Check current usage against limits
    const currentUsage = req.user.stats[feature.replace('_per_month', '')] || 0;
    
    if (currentUsage >= featureLimit) {
      return next(forbiddenError(`${feature} limit exceeded. Upgrade your plan for higher limits.`));
    }

    next();
  };
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

/**
 * Create and send JWT token in response
 */
const createSendToken = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    data: {
      user
    }
  });
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  authorizeOwnership,
  rateLimit,
  requireEmailVerification,
  requirePremium,
  authenticateAPIKey,
  logActivity,
  validateResourcePermissions,
  checkSubscriptionLimits,
  generateToken,
  createSendToken
};