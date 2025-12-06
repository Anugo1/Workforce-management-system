/**
 * Employee Controller
 * Handles HTTP requests for employee endpoints
 */

const EmployeeService = require('../services/EmployeeService');
const { HTTP_STATUS } = require('../utils/constants');
const { asyncHandler } = require('../middleware/errorHandler');

class EmployeeController {
  /**
   * Create a new employee
   * POST /employees
   */
  createEmployee = asyncHandler(async (req, res) => {
    const result = await EmployeeService.createEmployee(req.body);
    
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  /**
   * Get employee by ID
   * GET /employees/:id
   */
  getEmployeeById = asyncHandler(async (req, res) => {
    const result = await EmployeeService.getEmployeeById(req.params.id);
    
    res.status(HTTP_STATUS.OK).json(result);
  });

  /**
   * Get all employees
   * GET /employees
   */
  getAllEmployees = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, departmentId, search = '' } = req.query;
    
    const result = await EmployeeService.getAllEmployees({
      page,
      limit,
      departmentId,
      search
    });
    
    res.status(HTTP_STATUS.OK).json(result);
  });

  /**
   * Update employee
   * PUT /employees/:id
   */
  updateEmployee = asyncHandler(async (req, res) => {
    const result = await EmployeeService.updateEmployee(
      req.params.id,
      req.body
    );
    
    res.status(HTTP_STATUS.OK).json(result);
  });

  /**
   * Delete employee
   * DELETE /employees/:id
   */
  deleteEmployee = asyncHandler(async (req, res) => {
    const result = await EmployeeService.deleteEmployee(req.params.id);
    
    res.status(HTTP_STATUS.OK).json(result);
  });

  /**
   * Get employee with leave requests
   * GET /employees/:id/leave-requests
   */
  getEmployeeWithLeaveRequests = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    
    const result = await EmployeeService.getEmployeeWithLeaveRequests(
      req.params.id,
      { page, limit, status }
    );
    
    res.status(HTTP_STATUS.OK).json(result);
  });
}

module.exports = new EmployeeController();
