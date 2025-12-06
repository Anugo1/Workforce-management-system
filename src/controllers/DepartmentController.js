/**
 * Department Controller
 * Handles HTTP requests for department endpoints
 */

const DepartmentService = require('../services/DepartmentService');
const { HTTP_STATUS } = require('../utils/constants');
const { asyncHandler } = require('../middleware/errorHandler');

class DepartmentController {
  /**
   * Create a new department
   * POST /departments
   */
  createDepartment = asyncHandler(async (req, res) => {
    const result = await DepartmentService.createDepartment(req.body);
    
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  /**
   * Get department by ID
   * GET /departments/:id
   */
  getDepartmentById = asyncHandler(async (req, res) => {
    const result = await DepartmentService.getDepartmentById(req.params.id);
    
    res.status(HTTP_STATUS.OK).json(result);
  });

  /**
   * Get department with employees (paginated)
   * GET /departments/:id/employees
   */
  getDepartmentWithEmployees = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    const result = await DepartmentService.getDepartmentWithEmployees(
      req.params.id,
      { page, limit }
    );
    
    res.status(HTTP_STATUS.OK).json(result);
  });

  /**
   * Get all departments
   * GET /departments
   */
  getAllDepartments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const result = await DepartmentService.getAllDepartments({
      page,
      limit,
      search
    });
    
    res.status(HTTP_STATUS.OK).json(result);
  });

  /**
   * Update department
   * PUT /departments/:id
   */
  updateDepartment = asyncHandler(async (req, res) => {
    const result = await DepartmentService.updateDepartment(
      req.params.id,
      req.body
    );
    
    res.status(HTTP_STATUS.OK).json(result);
  });

  /**
   * Delete department
   * DELETE /departments/:id
   */
  deleteDepartment = asyncHandler(async (req, res) => {
    const result = await DepartmentService.deleteDepartment(req.params.id);
    
    res.status(HTTP_STATUS.OK).json(result);
  });
}

module.exports = new DepartmentController();
