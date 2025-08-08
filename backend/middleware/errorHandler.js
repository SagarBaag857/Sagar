/**
 * Error Handler Middleware
 * 
 * Centralized error handling for the AI Recipe Generator API.
 * Provides consistent error responses and logging.
 */

const mongoose = require('mongoose');

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle MongoDB cast errors
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle MongoDB duplicate field errors
 */
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

/**
 * Handle MongoDB validation errors
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

/**
 * Handle JWT expired errors
 */
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

/**
 * Send error response in development
 */
const sendErrorDev = (err, req, res) => {
  // API Error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    });
  }

  // Rendered website error
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, req, res) => {
  // API Error
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        timestamp: new Date().toISOString()
      });
    }

    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
      timestamp: new Date().toISOString()
    });
  }

  // Rendered website error
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }

  // Programming or other unknown error: don't leak error details
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

/**
 * Handle specific API errors
 */
const handleAPIErrors = (err) => {
  // OpenAI API errors
  if (err.message && err.message.includes('OpenAI')) {
    return new AppError('AI service temporarily unavailable. Please try again later.', 503);
  }

  // Vision API errors
  if (err.message && err.message.includes('Vision')) {
    return new AppError('Image analysis service temporarily unavailable. Please try again later.', 503);
  }

  // Nutrition API errors
  if (err.message && err.message.includes('Nutrition')) {
    return new AppError('Nutrition analysis service temporarily unavailable. Please try again later.', 503);
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large. Maximum file size is 10MB.', 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Too many files uploaded. Maximum is 5 files.', 400);
  }

  // Rate limiting errors
  if (err.message && err.message.includes('rate limit')) {
    return new AppError('Too many requests. Please try again later.', 429);
  }

  return err;
};

/**
 * Log error details
 */
const logError = (err, req) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    }
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error Details:', JSON.stringify(errorLog, null, 2));
  }

  // In production, you might want to send this to a logging service
  // like Winston, Loggly, or Sentry
  if (process.env.NODE_ENV === 'production') {
    // Example: winston.error(errorLog);
    console.error(`${errorLog.timestamp} - ${err.message}`);
  }
};

/**
 * Main error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error
  logError(err, req);

  let error = { ...err };
  error.message = err.message;

  // Handle specific types of errors
  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Handle API-specific errors
  error = handleAPIErrors(error);

  // Send error response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProd(error, req, res);
  }
};

/**
 * Catch async errors wrapper
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Handle unhandled routes
 */
const notFound = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};

/**
 * Validation error helper
 */
const validationError = (message, field = null) => {
  const error = new AppError(message, 400);
  if (field) {
    error.field = field;
  }
  return error;
};

/**
 * Authentication error helper
 */
const authError = (message = 'Authentication failed') => {
  return new AppError(message, 401);
};

/**
 * Authorization error helper
 */
const forbiddenError = (message = 'Access forbidden') => {
  return new AppError(message, 403);
};

/**
 * Resource not found error helper
 */
const notFoundError = (resource = 'Resource') => {
  return new AppError(`${resource} not found`, 404);
};

/**
 * Service unavailable error helper
 */
const serviceUnavailableError = (service = 'Service') => {
  return new AppError(`${service} temporarily unavailable`, 503);
};

/**
 * Rate limit error helper
 */
const rateLimitError = (message = 'Too many requests') => {
  return new AppError(message, 429);
};

module.exports = {
  AppError,
  errorHandler,
  catchAsync,
  notFound,
  validationError,
  authError,
  forbiddenError,
  notFoundError,
  serviceUnavailableError,
  rateLimitError
};