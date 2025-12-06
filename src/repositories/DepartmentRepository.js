/**
 * Department Repository
 * Handles all database operations for Department entity
 */

const { Department, Employee } = require('../models');
const { Op } = require('sequelize');

class DepartmentRepository {
  /**
   * Create a new department
   * @param {Object} departmentData - Department data
   * @returns {Promise<Department>}
   */
  async create(departmentData) {
    return await Department.create(departmentData);
  }

  /**
   * Find department by ID
   * @param {number} id - Department ID
   * @returns {Promise<Department|null>}
   */
  async findById(id) {
    return await Department.findByPk(id);
  }

  /**
   * Find department by name
   * @param {string} name - Department name
   * @returns {Promise<Department|null>}
   */
  async findByName(name) {
    return await Department.findOne({
      where: { name }
    });
  }

  /**
   * Find all departments with pagination
   * @param {Object} options - Query options
   * @returns {Promise<{rows: Department[], count: number}>}
   */
  async findAll(options = {}) {
    const { page = 1, limit = 10, search = '' } = options;
    const offset = (page - 1) * limit;

    const where = search ? {
      name: {
        [Op.like]: `%${search}%`
      }
    } : {};

    return await Department.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Get department with employees (paginated)
   * @param {number} id - Department ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Department|null>}
   */
  async findByIdWithEmployees(id, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    return await Department.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'employees',
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [['createdAt', 'DESC']],
          separate: true // This ensures proper pagination
        }
      ]
    });
  }

  /**
   * Count employees in department
   * @param {number} id - Department ID
   * @returns {Promise<number>}
   */
  async countEmployees(id) {
    return await Employee.count({
      where: { departmentId: id }
    });
  }

  /**
   * Update department
   * @param {number} id - Department ID
   * @param {Object} updateData - Update data
   * @returns {Promise<[number, Department[]]>}
   */
  async update(id, updateData) {
    return await Department.update(updateData, {
      where: { id },
      returning: true
    });
  }

  /**
   * Delete department
   * @param {number} id - Department ID
   * @returns {Promise<number>}
   */
  async delete(id) {
    return await Department.destroy({
      where: { id }
    });
  }

  /**
   * Check if department exists
   * @param {number} id - Department ID
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    const count = await Department.count({
      where: { id }
    });
    return count > 0;
  }
}

module.exports = new DepartmentRepository();
