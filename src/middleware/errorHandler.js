/**
 * Global error handling middleware
 */

const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Default error response
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal server error';

  // Handle specific error types
  if (err.name === 'SequelizeValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = err.errors.map(e => e.message).join(', ');
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Resource already exists';
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid reference to related resource';
  } else if (err.name === 'SequelizeDatabaseError') {
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    message = 'Database error occurred';
  } else if (err.message && err.message.includes('not found')) {
    statusCode = HTTP_STATUS.NOT_FOUND;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
