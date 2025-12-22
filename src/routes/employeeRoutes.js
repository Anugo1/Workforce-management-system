const express = require('express');

const EmployeeController = require('../controllers/EmployeeController');
const {
  validateEmployee,
  validateEmployeeUpdate,
  validatePagination,
  validateEmployeeListFilters,
  validateId,
  validateStatusQuery
} = require('../middleware/validation');
const { standardRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(standardRateLimiter);

router.post('/', validateEmployee, EmployeeController.createEmployee);
router.get(
  '/',
  validatePagination,
  validateEmployeeListFilters,
  EmployeeController.getAllEmployees
);
router.get('/:id', validateId, EmployeeController.getEmployeeById);
router.put('/:id', validateId, validateEmployeeUpdate, EmployeeController.updateEmployee);
router.delete('/:id', validateId, EmployeeController.deleteEmployee);
router.get(
  '/:id/leave-requests',
  validateId,
  validatePagination,
  validateStatusQuery,
  EmployeeController.getEmployeeWithLeaveRequests
);

module.exports = router;
