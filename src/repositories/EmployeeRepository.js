/**
 * Employee Repository
 * Handles all database operations for Employee entity
 */

const { Employee, Department, LeaveRequest } = require('../models');
const { Op } = require('sequelize');

class EmployeeRepository {
  /**
   * Create a new employee
   * @param {Object} employeeData - Employee data
   * @returns {Promise<Employee>}
   */
  async create(employeeData) {
    return await Employee.create(employeeData);
  }

  /**
   * Find employee by ID
   * @param {number} id - Employee ID
   * @param {boolean} includeDepartment - Include department data
   * @returns {Promise<Employee|null>}
   */
  async findById(id, includeDepartment = false) {
    const options = {
      where: { id }
    };

    if (includeDepartment) {
      options.include = [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ];
    }

    return await Employee.findOne(options);
  }

  /**
   * Find employee by email
   * @param {string} email - Employee email
   * @returns {Promise<Employee|null>}
   */
  async findByEmail(email) {
    return await Employee.findOne({
      where: { email }
    });
  }

  /**
   * Find all employees with pagination
   * @param {Object} options - Query options
   * @returns {Promise<{rows: Employee[], count: number}>}
   */
  async findAll(options = {}) {
    const { page = 1, limit = 10, departmentId = null, search = '' } = options;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    return await Employee.findAndCountAll({
      where,
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Find employees by department
   * @param {number} departmentId - Department ID
   * @param {Object} options - Pagination options
   * @returns {Promise<{rows: Employee[], count: number}>}
   */
  async findByDepartment(departmentId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    return await Employee.findAndCountAll({
      where: { departmentId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Update employee
   * @param {number} id - Employee ID
   * @param {Object} updateData - Update data
   * @returns {Promise<[number, Employee[]]>}
   */
  async update(id, updateData) {
    return await Employee.update(updateData, {
      where: { id },
      returning: true
    });
  }

  /**
   * Delete employee
   * @param {number} id - Employee ID
   * @returns {Promise<number>}
   */
  async delete(id) {
    return await Employee.destroy({
      where: { id }
    });
  }

  /**
   * Check if employee exists
   * @param {number} id - Employee ID
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    const count = await Employee.count({
      where: { id }
    });
    return count > 0;
  }

  /**
   * Check if email exists
   * @param {string} email - Employee email
   * @param {number} excludeId - Employee ID to exclude from check
   * @returns {Promise<boolean>}
   */
  async emailExists(email, excludeId = null) {
    const where = { email };
    
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const count = await Employee.count({ where });
    return count > 0;
  }

  /**
   * Get employee with leave requests
   * @param {number} id - Employee ID
   * @param {Object} options - Query options
   * @returns {Promise<Employee|null>}
   */
  async findByIdWithLeaveRequests(id, options = {}) {
    const { page = 1, limit = 10, status = null } = options;
    const offset = (page - 1) * limit;

    const leaveRequestWhere = status ? { status } : {};

    return await Employee.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: LeaveRequest,
          as: 'leaveRequests',
          where: leaveRequestWhere,
          required: false,
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [['createdAt', 'DESC']],
          separate: true
        }
      ]
    });
  }
}

module.exports = new EmployeeRepository();
