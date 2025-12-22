const express = require('express');

const LeaveRequestController = require('../controllers/LeaveRequestController');
const {
  validateLeaveRequest,
  validatePagination,
  validateLeaveRequestFilters,
  validateStatus,
  validateId,
  validateEmployeeIdBody,
  validateEmployeeIdParam,
  validateYearQuery
} = require('../middleware/validation');
const { standardRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(standardRateLimiter);

router.post('/', validateLeaveRequest, LeaveRequestController.createLeaveRequest);
router.get(
  '/',
  validatePagination,
  validateLeaveRequestFilters,
  LeaveRequestController.getAllLeaveRequests
);
router.get('/:id', validateId, LeaveRequestController.getLeaveRequestById);
router.patch(
  '/:id/status',
  validateId,
  validateStatus,
  LeaveRequestController.updateLeaveRequestStatus
);
router.delete(
  '/:id',
  validateId,
  validateEmployeeIdBody,
  LeaveRequestController.cancelLeaveRequest
);
router.get(
  '/stats/:employeeId',
  validateEmployeeIdParam,
  validateYearQuery,
  LeaveRequestController.getEmployeeLeaveStats
);

module.exports = router;
