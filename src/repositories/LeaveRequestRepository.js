/**
 * LeaveRequest Repository
 * Handles all database operations for LeaveRequest entity
 */

const { LeaveRequest, Employee, Department } = require('../models');
const { Op } = require('sequelize');
const { LEAVE_REQUEST_STATUS } = require('../utils/constants');

class LeaveRequestRepository {
  /**
   * Create a new leave request
   * @param {Object} leaveRequestData - Leave request data
   * @returns {Promise<LeaveRequest>}
   */
  async create(leaveRequestData) {
    return await LeaveRequest.create(leaveRequestData);
  }

  /**
   * Find leave request by ID
   * @param {number} id - Leave request ID
   * @param {boolean} includeEmployee - Include employee data
   * @returns {Promise<LeaveRequest|null>}
   */
  async findById(id, includeEmployee = false) {
    const options = {
      where: { id }
    };

    if (includeEmployee) {
      options.include = [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'departmentId'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            }
          ]
        }
      ];
    }

    return await LeaveRequest.findOne(options);
  }

  /**
   * Find leave request by idempotency key
   * @param {string} idempotencyKey - Idempotency key
   * @returns {Promise<LeaveRequest|null>}
   */
  async findByIdempotencyKey(idempotencyKey) {
    return await LeaveRequest.findOne({
      where: { idempotencyKey }
    });
  }

  /**
   * Find all leave requests with pagination
   * @param {Object} options - Query options
   * @returns {Promise<{rows: LeaveRequest[], count: number}>}
   */
  async findAll(options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      employeeId = null, 
      status = null,
      startDate = null,
      endDate = null
    } = options;
    
    const offset = (page - 1) * limit;
    const where = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate) {
      where.startDate = { [Op.gte]: startDate };
    }

    if (endDate) {
      where.endDate = { [Op.lte]: endDate };
    }

    return await LeaveRequest.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Find leave requests by employee
   * @param {number} employeeId - Employee ID
   * @param {Object} options - Query options
   * @returns {Promise<{rows: LeaveRequest[], count: number}>}
   */
  async findByEmployee(employeeId, options = {}) {
    const { page = 1, limit = 10, status = null } = options;
    const offset = (page - 1) * limit;

    const where = { employeeId };
    
    if (status) {
      where.status = status;
    }

    return await LeaveRequest.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Check for overlapping leave requests
   * @param {number} employeeId - Employee ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {number} excludeId - Leave request ID to exclude
   * @returns {Promise<LeaveRequest[]>}
   */
  async findOverlapping(employeeId, startDate, endDate, excludeId = null) {
    const where = {
      employeeId,
      status: {
        [Op.in]: [LEAVE_REQUEST_STATUS.APPROVED, LEAVE_REQUEST_STATUS.PENDING_APPROVAL]
      },
      [Op.or]: [
        {
          startDate: {
            [Op.between]: [startDate, endDate]
          }
        },
        {
          endDate: {
            [Op.between]: [startDate, endDate]
          }
        },
        {
          [Op.and]: [
            { startDate: { [Op.lte]: startDate } },
            { endDate: { [Op.gte]: endDate } }
          ]
        }
      ]
    };

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    return await LeaveRequest.findAll({ where });
  }

  /**
   * Update leave request
   * @param {number} id - Leave request ID
   * @param {Object} updateData - Update data
   * @returns {Promise<[number, LeaveRequest[]]>}
   */
  async update(id, updateData) {
    return await LeaveRequest.update(updateData, {
      where: { id },
      returning: true
    });
  }

  /**
   * Update leave request status
   * @param {number} id - Leave request ID
   * @param {string} status - New status
   * @returns {Promise<[number, LeaveRequest[]]>}
   */
  async updateStatus(id, status) {
    return await LeaveRequest.update(
      { 
        status,
        processedAt: new Date()
      },
      {
        where: { id },
        returning: true
      }
    );
  }

  /**
   * Delete leave request
   * @param {number} id - Leave request ID
   * @returns {Promise<number>}
   */
  async delete(id) {
    return await LeaveRequest.destroy({
      where: { id }
    });
  }

  /**
   * Check if leave request exists
   * @param {number} id - Leave request ID
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    const count = await LeaveRequest.count({
      where: { id }
    });
    return count > 0;
  }

  /**
   * Get leave request statistics for employee
   * @param {number} employeeId - Employee ID
   * @param {number} year - Year
   * @returns {Promise<Object>}
   */
  async getEmployeeStats(employeeId, year = new Date().getFullYear()) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const requests = await LeaveRequest.findAll({
      where: {
        employeeId,
        createdAt: {
          [Op.between]: [startOfYear, endOfYear]
        }
      },
      attributes: ['status', 'startDate', 'endDate']
    });

    const stats = {
      total: requests.length,
      approved: 0,
      pending: 0,
      rejected: 0,
      totalDays: 0
    };

    requests.forEach(request => {
      const days = Math.ceil(
        (new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24)
      ) + 1;

      if (request.status === LEAVE_REQUEST_STATUS.APPROVED) {
        stats.approved++;
        stats.totalDays += days;
      } else if (request.status === LEAVE_REQUEST_STATUS.PENDING || 
                 request.status === LEAVE_REQUEST_STATUS.PENDING_APPROVAL) {
        stats.pending++;
      } else if (request.status === LEAVE_REQUEST_STATUS.REJECTED) {
        stats.rejected++;
      }
    });

    return stats;
  }
}

module.exports = new LeaveRequestRepository();
