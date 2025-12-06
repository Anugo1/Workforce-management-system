/**
 * LeaveRequest Model
 * Represents employee leave requests
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { LEAVE_REQUEST_STATUS } = require('../utils/constants');

const LeaveRequest = sequelize.define('LeaveRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'employee_id',
    references: {
      model: 'employees',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date',
    validate: {
      isDate: true,
      notEmpty: true
    }
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'end_date',
    validate: {
      isDate: true,
      notEmpty: true,
      isAfterStartDate(value) {
        if (new Date(value) < new Date(this.startDate)) {
          throw new Error('End date must be after or equal to start date');
        }
      }
    }
  },
  status: {
    type: DataTypes.ENUM(
      LEAVE_REQUEST_STATUS.PENDING,
      LEAVE_REQUEST_STATUS.APPROVED,
      LEAVE_REQUEST_STATUS.REJECTED,
      LEAVE_REQUEST_STATUS.PENDING_APPROVAL
    ),
    allowNull: false,
    defaultValue: LEAVE_REQUEST_STATUS.PENDING
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'processed_at'
  },
  idempotencyKey: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    field: 'idempotency_key'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'leave_requests',
  timestamps: true,
  indexes: [
    {
      fields: ['employee_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['start_date']
    },
    {
      fields: ['end_date']
    },
    {
      fields: ['created_at']
    },
    {
      unique: true,
      fields: ['idempotency_key'],
      where: {
        idempotency_key: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    },
    {
      // Composite index for common queries
      fields: ['employee_id', 'status', 'created_at']
    }
  ]
});

module.exports = LeaveRequest;
