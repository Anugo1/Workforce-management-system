const express = require('express');

const DepartmentController = require('../controllers/DepartmentController');
const {
  validateDepartment,
  validatePagination,
  validateId
} = require('../middleware/validation');
const { standardRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(standardRateLimiter);

router.post('/', validateDepartment, DepartmentController.createDepartment);
router.get('/', validatePagination, DepartmentController.getAllDepartments);
router.get('/:id', validateId, DepartmentController.getDepartmentById);
router.get(
  '/:id/employees',
  validateId,
  validatePagination,
  DepartmentController.getDepartmentWithEmployees
);
router.put('/:id', validateId, validateDepartment, DepartmentController.updateDepartment);
router.delete('/:id', validateId, DepartmentController.deleteDepartment);

module.exports = router;
