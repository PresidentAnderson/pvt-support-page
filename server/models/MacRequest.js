const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MacRequest = sequelize.define('MacRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ticketNumber: {
    type: DataTypes.STRING,
    unique: true,
    field: 'ticket_number'
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
    references: {
      model: 'organizations',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  requestType: {
    type: DataTypes.ENUM('move', 'add', 'change', 'remove'),
    allowNull: false,
    field: 'request_type'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled', 'on_hold'),
    defaultValue: 'pending'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  affectedSystems: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'affected_systems'
  },
  assignedTo: {
    type: DataTypes.UUID,
    field: 'assigned_to',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at'
  },
  cancelledAt: {
    type: DataTypes.DATE,
    field: 'cancelled_at'
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    field: 'cancellation_reason'
  },
  estimatedCompletion: {
    type: DataTypes.DATE,
    field: 'estimated_completion'
  },
  actualCompletion: {
    type: DataTypes.DATE,
    field: 'actual_completion'
  },
  attachments: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'mac_requests',
  timestamps: true,
  hooks: {
    beforeCreate: async (request) => {
      // Generate ticket number
      const count = await MacRequest.count();
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      request.ticketNumber = `MAC-${year}${month}-${String(count + 1).padStart(5, '0')}`;
      
      // Set estimated completion based on priority
      if (!request.estimatedCompletion) {
        const daysToAdd = {
          low: 5,
          medium: 2,
          high: 1,
          critical: 0.5
        };
        
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + daysToAdd[request.priority]);
        request.estimatedCompletion = estimatedDate;
      }
    }
  }
});

module.exports = MacRequest;