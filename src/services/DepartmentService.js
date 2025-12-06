/**
 * Department Service
 * Contains business logic for department operations
 */

const DepartmentRepository = require('../repositories/DepartmentRepository');
const logger = require('../utils/logger');

class DepartmentService {
  /**
   * Create a new department
   * @param {Object} departmentData - Department data
   * @returns {Promise<Object>}
   */
  async createDepartment(departmentData) {
    try {
      // Check if department with same name exists
      const existingDepartment = await DepartmentRepository.findByName(departmentData.name);
      
      if (existingDepartment) {
        throw new Error('Department with this name already exists');
      }

      const department = await DepartmentRepository.create(departmentData);
      
      logger.info('Department created', { departmentId: department.id });
      
      return {
        success: true,
        data: department
      };
    } catch (error) {
      logger.error('Error creating department', error);
      throw error;
    }
  }

  /**
   * Get department by ID
   * @param {number} id - Department ID
   * @returns {Promise<Object>}
   */
  async getDepartmentById(id) {
    try {
      const department = await DepartmentRepository.findById(id);
      
      if (!department) {
        throw new Error('Department not found');
      }

      return {
        success: true,
        data: department
      };
    } catch (error) {
      logger.error('Error fetching department', error);
      throw error;
    }
  }

  /**
   * Get department with employees (paginated)
   * @param {number} id - Department ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async getDepartmentWithEmployees(id, options = {}) {
    try {
      const department = await DepartmentRepository.findById(id);
      
      if (!department) {
        throw new Error('Department not found');
      }

      const totalEmployees = await DepartmentRepository.countEmployees(id);
      const departmentWithEmployees = await DepartmentRepository.findByIdWithEmployees(id, options);

      const { page = 1, limit = 10 } = options;
      const totalPages = Math.ceil(totalEmployees / limit);

      return {
        success: true,
        data: {
          department: {
            id: department.id,
            name: department.name,
            createdAt: department.createdAt
          },
          employees: departmentWithEmployees.employees || [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalEmployees,
            totalPages
          }
        }
      };
    } catch (error) {
      logger.error('Error fetching department with employees', error);
      throw error;
    }
  }

  /**
   * Get all departments with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getAllDepartments(options = {}) {
    try {
      const { rows, count } = await DepartmentRepository.findAll(options);
      
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
      logger.error('Error fetching departments', error);
      throw error;
    }
  }

  /**
   * Update department
   * @param {number} id - Department ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>}
   */
  async updateDepartment(id, updateData) {
    try {
      const exists = await DepartmentRepository.exists(id);
      
      if (!exists) {
        throw new Error('Department not found');
      }

      // Check if new name conflicts with existing department
      if (updateData.name) {
        const existingDepartment = await DepartmentRepository.findByName(updateData.name);
        if (existingDepartment && existingDepartment.id !== id) {
          throw new Error('Department with this name already exists');
        }
      }

      await DepartmentRepository.update(id, updateData);
      const updatedDepartment = await DepartmentRepository.findById(id);

      logger.info('Department updated', { departmentId: id });

      return {
        success: true,
        data: updatedDepartment
      };
    } catch (error) {
      logger.error('Error updating department', error);
      throw error;
    }
  }

  /**
   * Delete department
   * @param {number} id - Department ID
   * @returns {Promise<Object>}
   */
  async deleteDepartment(id) {
    try {
      const exists = await DepartmentRepository.exists(id);
      
      if (!exists) {
        throw new Error('Department not found');
      }

      // Check if department has employees
      const employeeCount = await DepartmentRepository.countEmployees(id);
      if (employeeCount > 0) {
        throw new Error('Cannot delete department with existing employees');
      }

      await DepartmentRepository.delete(id);

      logger.info('Department deleted', { departmentId: id });

      return {
        success: true,
        message: 'Department deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting department', error);
      throw error;
    }
  }
}

module.exports = new DepartmentService();
