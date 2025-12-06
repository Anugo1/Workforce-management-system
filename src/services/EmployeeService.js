/**
 * Employee Service
 * Contains business logic for employee operations
 */

const EmployeeRepository = require('../repositories/EmployeeRepository');
const DepartmentRepository = require('../repositories/DepartmentRepository');
const logger = require('../utils/logger');

class EmployeeService {
  /**
   * Create a new employee
   * @param {Object} employeeData - Employee data
   * @returns {Promise<Object>}
   */
  async createEmployee(employeeData) {
    try {
      // Validate department exists
      const departmentExists = await DepartmentRepository.exists(employeeData.departmentId);
      
      if (!departmentExists) {
        throw new Error('Department not found');
      }

      // Check if email already exists
      const emailExists = await EmployeeRepository.emailExists(employeeData.email);
      
      if (emailExists) {
        throw new Error('Employee with this email already exists');
      }

      const employee = await EmployeeRepository.create(employeeData);
      
      // Fetch with department info
      const employeeWithDepartment = await EmployeeRepository.findById(employee.id, true);

      logger.info('Employee created', { employeeId: employee.id });

      return {
        success: true,
        data: employeeWithDepartment
      };
    } catch (error) {
      logger.error('Error creating employee', error);
      throw error;
    }
  }

  /**
   * Get employee by ID
   * @param {number} id - Employee ID
   * @returns {Promise<Object>}
   */
  async getEmployeeById(id) {
    try {
      const employee = await EmployeeRepository.findById(id, true);
      
      if (!employee) {
        throw new Error('Employee not found');
      }

      return {
        success: true,
        data: employee
      };
    } catch (error) {
      logger.error('Error fetching employee', error);
      throw error;
    }
  }

  /**
   * Get all employees with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getAllEmployees(options = {}) {
    try {
      const { rows, count } = await EmployeeRepository.findAll(options);
      
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
      logger.error('Error fetching employees', error);
      throw error;
    }
  }

  /**
   * Get employees by department
   * @param {number} departmentId - Department ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async getEmployeesByDepartment(departmentId, options = {}) {
    try {
      // Validate department exists
      const departmentExists = await DepartmentRepository.exists(departmentId);
      
      if (!departmentExists) {
        throw new Error('Department not found');
      }

      const { rows, count } = await EmployeeRepository.findByDepartment(departmentId, options);
      
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
      logger.error('Error fetching employees by department', error);
      throw error;
    }
  }

  /**
   * Update employee
   * @param {number} id - Employee ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>}
   */
  async updateEmployee(id, updateData) {
    try {
      const exists = await EmployeeRepository.exists(id);
      
      if (!exists) {
        throw new Error('Employee not found');
      }

      // Validate department if being updated
      if (updateData.departmentId) {
        const departmentExists = await DepartmentRepository.exists(updateData.departmentId);
        if (!departmentExists) {
          throw new Error('Department not found');
        }
      }

      // Check email uniqueness if being updated
      if (updateData.email) {
        const emailExists = await EmployeeRepository.emailExists(updateData.email, id);
        if (emailExists) {
          throw new Error('Employee with this email already exists');
        }
      }

      await EmployeeRepository.update(id, updateData);
      const updatedEmployee = await EmployeeRepository.findById(id, true);

      logger.info('Employee updated', { employeeId: id });

      return {
        success: true,
        data: updatedEmployee
      };
    } catch (error) {
      logger.error('Error updating employee', error);
      throw error;
    }
  }

  /**
   * Delete employee
   * @param {number} id - Employee ID
   * @returns {Promise<Object>}
   */
  async deleteEmployee(id) {
    try {
      const exists = await EmployeeRepository.exists(id);
      
      if (!exists) {
        throw new Error('Employee not found');
      }

      await EmployeeRepository.delete(id);

      logger.info('Employee deleted', { employeeId: id });

      return {
        success: true,
        message: 'Employee deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting employee', error);
      throw error;
    }
  }

  /**
   * Get employee with leave requests
   * @param {number} id - Employee ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getEmployeeWithLeaveRequests(id, options = {}) {
    try {
      const employee = await EmployeeRepository.findByIdWithLeaveRequests(id, options);
      
      if (!employee) {
        throw new Error('Employee not found');
      }

      return {
        success: true,
        data: employee
      };
    } catch (error) {
      logger.error('Error fetching employee with leave requests', error);
      throw error;
    }
  }
}

module.exports = new EmployeeService();
