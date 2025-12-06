/**
 * LeaveRequest Service
 * Contains business logic for leave request operations
 * Integrates with RabbitMQ for async processing
 */

const LeaveRequestRepository = require('../repositories/LeaveRequestRepository');
const EmployeeRepository = require('../repositories/EmployeeRepository');
const { publishMessage } = require('../config/rabbitmq');
const { QUEUE_EVENTS, LEAVE_REQUEST_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');
const crypto = require('crypto');

class LeaveRequestService {
  /**
   * Create a new leave request
   * @param {Object} leaveRequestData - Leave request data
   * @returns {Promise<Object>}
   */
  async createLeaveRequest(leaveRequestData) {
    try {
      // Validate employee exists
      const employeeExists = await EmployeeRepository.exists(leaveRequestData.employeeId);
      
      if (!employeeExists) {
        throw new Error('Employee not found');
      }

      // Validate dates
      const startDate = new Date(leaveRequestData.startDate);
      const endDate = new Date(leaveRequestData.endDate);
      
      if (startDate > endDate) {
        throw new Error('Start date must be before or equal to end date');
      }

      if (startDate < new Date().setHours(0, 0, 0, 0)) {
        throw new Error('Cannot create leave request for past dates');
      }

      // Check for overlapping leave requests
      const overlapping = await LeaveRequestRepository.findOverlapping(
        leaveRequestData.employeeId,
        leaveRequestData.startDate,
        leaveRequestData.endDate
      );

      if (overlapping.length > 0) {
        throw new Error('Leave request overlaps with existing approved or pending request');
      }

      // Generate idempotency key if not provided
      const idempotencyKey = leaveRequestData.idempotencyKey || 
        crypto.randomBytes(16).toString('hex');

      // Check idempotency
      const existingRequest = await LeaveRequestRepository.findByIdempotencyKey(idempotencyKey);
      if (existingRequest) {
        logger.info('Duplicate request detected, returning existing', { 
          idempotencyKey,
          leaveRequestId: existingRequest.id 
        });
        return {
          success: true,
          data: existingRequest,
          duplicate: true
        };
      }

      // Create leave request with PENDING status
      const leaveRequest = await LeaveRequestRepository.create({
        ...leaveRequestData,
        status: LEAVE_REQUEST_STATUS.PENDING,
        idempotencyKey
      });

      logger.info('Leave request created', { leaveRequestId: leaveRequest.id });

      // Publish to queue for async processing
      try {
        await publishMessage(QUEUE_EVENTS.LEAVE_REQUESTED, {
          id: leaveRequest.id,
          employeeId: leaveRequest.employeeId,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          status: leaveRequest.status,
          idempotencyKey: leaveRequest.idempotencyKey,
          timestamp: new Date().toISOString()
        });

        logger.info('Leave request published to queue', { leaveRequestId: leaveRequest.id });
      } catch (queueError) {
        logger.error('Failed to publish to queue', queueError);
        // Don't fail the request, it's already created
      }

      // Fetch with employee details
      const leaveRequestWithDetails = await LeaveRequestRepository.findById(leaveRequest.id, true);

      return {
        success: true,
        data: leaveRequestWithDetails
      };
    } catch (error) {
      logger.error('Error creating leave request', error);
      throw error;
    }
  }

  /**
   * Get leave request by ID
   * @param {number} id - Leave request ID
   * @returns {Promise<Object>}
   */
  async getLeaveRequestById(id) {
    try {
      const leaveRequest = await LeaveRequestRepository.findById(id, true);
      
      if (!leaveRequest) {
        throw new Error('Leave request not found');
      }

      return {
        success: true,
        data: leaveRequest
      };
    } catch (error) {
      logger.error('Error fetching leave request', error);
      throw error;
    }
  }

  /**
   * Get all leave requests with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getAllLeaveRequests(options = {}) {
    try {
      const { rows, count } = await LeaveRequestRepository.findAll(options);
      
      const { page = 1, limit = 10 } = options;
      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Error fetching leave requests', error);
      throw error;
    }
  }

  /**
   * Get leave requests by employee
   * @param {number} employeeId - Employee ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getLeaveRequestsByEmployee(employeeId, options = {}) {
    try {
      const employeeExists = await EmployeeRepository.exists(employeeId);
      
      if (!employeeExists) {
        throw new Error('Employee not found');
      }

      const { rows, count } = await LeaveRequestRepository.findByEmployee(employeeId, options);
      
      const { page = 1, limit = 10 } = options;
      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Error fetching leave requests by employee', error);
      throw error;
    }
  }

  /**
   * Update leave request status
   * @param {number} id - Leave request ID
   * @param {string} status - New status
   * @returns {Promise<Object>}
   */
  async updateLeaveRequestStatus(id, status) {
    try {
      const exists = await LeaveRequestRepository.exists(id);
      
      if (!exists) {
        throw new Error('Leave request not found');
      }

      // Validate status
      const validStatuses = Object.values(LEAVE_REQUEST_STATUS);
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }

      await LeaveRequestRepository.updateStatus(id, status);
      const updatedLeaveRequest = await LeaveRequestRepository.findById(id, true);

      logger.info('Leave request status updated', { leaveRequestId: id, status });

      return {
        success: true,
        data: updatedLeaveRequest
      };
    } catch (error) {
      logger.error('Error updating leave request status', error);
      throw error;
    }
  }

  /**
   * Cancel leave request
   * @param {number} id - Leave request ID
   * @param {number} employeeId - Employee ID (for authorization)
   * @returns {Promise<Object>}
   */
  async cancelLeaveRequest(id, employeeId) {
    try {
      const leaveRequest = await LeaveRequestRepository.findById(id);
      
      if (!leaveRequest) {
        throw new Error('Leave request not found');
      }

      if (leaveRequest.employeeId !== employeeId) {
        throw new Error('Unauthorized to cancel this leave request');
      }

      if (leaveRequest.status === LEAVE_REQUEST_STATUS.REJECTED) {
        throw new Error('Cannot cancel rejected leave request');
      }

      await LeaveRequestRepository.delete(id);

      logger.info('Leave request cancelled', { leaveRequestId: id });

      return {
        success: true,
        message: 'Leave request cancelled successfully'
      };
    } catch (error) {
      logger.error('Error cancelling leave request', error);
      throw error;
    }
  }

  /**
   * Get employee leave statistics
   * @param {number} employeeId - Employee ID
   * @param {number} year - Year
   * @returns {Promise<Object>}
   */
  async getEmployeeLeaveStats(employeeId, year) {
    try {
      const employeeExists = await EmployeeRepository.exists(employeeId);
      
      if (!employeeExists) {
        throw new Error('Employee not found');
      }

      const stats = await LeaveRequestRepository.getEmployeeStats(employeeId, year);

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Error fetching employee leave stats', error);
      throw error;
    }
  }
}

module.exports = new LeaveRequestService();
