/**
 * Models index file
 * Defines relationships between models
 */

const Department = require('./Department');
const Employee = require('./Employee');
const LeaveRequest = require('./LeaveRequest');

// Define relationships

// Department has many Employees
Department.hasMany(Employee, {
  foreignKey: 'departmentId',
  as: 'employees',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

// Employee belongs to Department
Employee.belongsTo(Department, {
  foreignKey: 'departmentId',
  as: 'department',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

// Employee has many LeaveRequests
Employee.hasMany(LeaveRequest, {
  foreignKey: 'employeeId',
  as: 'leaveRequests',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// LeaveRequest belongs to Employee
LeaveRequest.belongsTo(Employee, {
  foreignKey: 'employeeId',
  as: 'employee',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

module.exports = {
  Department,
  Employee,
  LeaveRequest
};
