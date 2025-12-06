/**
 * LeaveRequest Controller
 * Handles HTTP requests for leave request endpoints
 */

const LeaveRequestService = require('../services/LeaveRequestService');
const { HTTP_STATUS } = require('../utils/constants');
const { asyncHandler } = require('../middleware/errorHandler');

class LeaveRequestController {
  /**
   * Create a new leave request
   * POST /leave-requests
   */
  createLeaveRequest = asyncHandler(async (req, res) => {
    const result = await LeaveRequestService.createLeaveRequest(req.body);
    
    const statusCode = result.duplicate ? HTTP_STATUS.OK : HTTP_STATUS.CREATED;
    res.status(statusCode).json(result);
  });

  /**
   * Get leave request by ID
   * GET /leave-requests/:id
   */
  getLeaveRequestById = asyncHandler(async (req, res) => {
    const result = await LeaveRequestService.getLeaveRequestById(req.params.id);
    
    res.status(HTTP_STATUS.OK).json(result);
  });

  /**
   * Get all leave requests
   * GET /leave-requests
   */
  getAllLeaveRequests = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 10, 
      employeeId, 
      status,
      startDate,
      endDate 
    } = req.query;
    
    const result = await LeaveRequestService.getAllLeaveRequests({
      page,
      limit,
      employeeId,
      status,
      startDate,
      endDate
    });
    
    res.status(HTTP_STATUS.OK).json(result);
  });

  /**
   * Update leave request status
   * PATCH /leave-requests/:id/status
   */
  updateLeaveRequestStatus = asyncHandler(async (req, res) => {
    const result = await LeaveRequestService.updateLeaveRequestStatus(
      req.params.id,
      req.body.status
    );
    
    res.status(HTTP_STATUS.OK).json(result);
  });

  /**
   * Cancel leave request
   * DELETE /leave-requests/:id
   */
  cancelLeaveRequest = asyncHandler(async (req, res) => {
    // In a real app, you'd get employeeId from authenticated user
    const { employeeId } = req.body;
    
    const result = await LeaveRequestService.cancelLeaveRequest(
      req.params.id,
      employeeId
    );
    
    res.status(HTTP_STATUS.OK).json(result);
  });

  /**
   * Get employee leave statistics
   * GET /leave-requests/stats/:employeeId
   */
  getEmployeeLeaveStats = asyncHandler(async (req, res) => {
    const { year = new Date().getFullYear() } = req.query;
    
    const result = await LeaveRequestService.getEmployeeLeaveStats(
      req.params.employeeId,
      parseInt(year)
    );
    
    res.status(HTTP_STATUS.OK).json(result);
  });
}

module.exports = new LeaveRequestController();
