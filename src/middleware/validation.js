/**
 * Request validation middleware using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');
const { HTTP_STATUS, LEAVE_REQUEST_STATUS } = require('../utils/constants');

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
 * Employee update validation rules (partial)
 */
const validateEmployeeUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Employee name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('departmentId')
    .optional()
    .isInt({ min: 1 }).withMessage('Department ID must be a positive integer'),
  body().custom((value, { req }) => {
    if (!Object.keys(req.body || {}).length) {
      throw new Error('At least one field must be provided for update');
    }
    return true;
  }),
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
 * Build ID validator for a specific param name
 */
const buildIdValidator = (paramName = 'id') => ([
  param(paramName)
    .isInt({ min: 1 }).withMessage(`${paramName} must be a positive integer`),
  handleValidationErrors
]);

/**
 * ID parameter validation
 */
const validateId = buildIdValidator();

/**
 * Employee ID param validation (e.g., stats endpoints)
 */
const validateEmployeeIdParam = buildIdValidator('employeeId');

/**
 * Employee ID in body validation
 */
const validateEmployeeIdBody = [
  body('employeeId')
    .notEmpty().withMessage('Employee ID is required')
    .isInt({ min: 1 }).withMessage('Employee ID must be a positive integer'),
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
 * Employee list filters (query params)
 */
const validateEmployeeListFilters = [
  query('departmentId')
    .optional()
    .isInt({ min: 1 }).withMessage('Department ID filter must be a positive integer'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 255 }).withMessage('Search term must be between 1 and 255 characters'),
  handleValidationErrors
];

/**
 * Status validation
 */
const validateStatus = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(Object.values(LEAVE_REQUEST_STATUS))
    .withMessage('Invalid status value'),
  handleValidationErrors
];

/**
 * Status query validation
 */
const validateStatusQuery = [
  query('status')
    .optional()
    .isIn(Object.values(LEAVE_REQUEST_STATUS))
    .withMessage('Invalid status value'),
  handleValidationErrors
];

/**
 * Leave request filters validation (query params)
 */
const validateLeaveRequestFilters = [
  query('employeeId')
    .optional()
    .isInt({ min: 1 }).withMessage('Employee ID filter must be a positive integer'),
  query('status')
    .optional()
    .isIn(Object.values(LEAVE_REQUEST_STATUS))
    .withMessage('Invalid status filter'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Start date filter must be a valid date (YYYY-MM-DD)'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('End date filter must be a valid date (YYYY-MM-DD)'),
  handleValidationErrors
];

/**
 * Year query validation (e.g., stats endpoints)
 */
const validateYearQuery = [
  query('year')
    .optional()
    .isInt({ min: 1970, max: 3000 }).withMessage('Year must be a valid number (1970-3000)'),
  handleValidationErrors
];

module.exports = {
  validateDepartment,
  validateEmployee,
  validateEmployeeUpdate,
  validateLeaveRequest,
  validateId,
  validateEmployeeIdParam,
  validateEmployeeIdBody,
  validatePagination,
  validateEmployeeListFilters,
  validateStatus,
  validateStatusQuery,
  validateLeaveRequestFilters,
  validateYearQuery,
  buildIdValidator,
  handleValidationErrors
};
