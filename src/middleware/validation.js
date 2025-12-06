/**
 * Request validation middleware using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Department validation rules
 */
const validateDepartment = [
  body('name')
    .trim()
    .notEmpty().withMessage('Department name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Department name must be between 2 and 100 characters'),
  handleValidationErrors
];

/**
 * Employee validation rules
 */
const validateEmployee = [
  body('name')
    .trim()
    .notEmpty().withMessage('Employee name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Employee name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('departmentId')
    .notEmpty().withMessage('Department ID is required')
    .isInt({ min: 1 }).withMessage('Department ID must be a positive integer'),
  handleValidationErrors
];

/**
 * Leave request validation rules
 */
const validateLeaveRequest = [
  body('employeeId')
    .notEmpty().withMessage('Employee ID is required')
    .isInt({ min: 1 }).withMessage('Employee ID must be a positive integer'),
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('End date must be a valid date (YYYY-MM-DD)')
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('End date must be after or equal to start date');
      }
      return true;
    }),
  body('idempotencyKey')
    .optional()
    .isString().withMessage('Idempotency key must be a string'),
  handleValidationErrors
];

/**
 * ID parameter validation
 */
const validateId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

/**
 * Status validation
 */
const validateStatus = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['PENDING', 'APPROVED', 'REJECTED', 'PENDING_APPROVAL'])
    .withMessage('Invalid status value'),
  handleValidationErrors
];

module.exports = {
  validateDepartment,
  validateEmployee,
  validateLeaveRequest,
  validateId,
  validatePagination,
  validateStatus,
  handleValidationErrors
};
