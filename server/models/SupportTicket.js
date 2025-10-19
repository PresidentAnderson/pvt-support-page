const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SupportTicket = sequelize.define('SupportTicket', {
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
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  organizationId: {
    type: DataTypes.UUID,
    field: 'organization_id',
    references: {
      model: 'organizations',
      key: 'id'
    }
  },
  category: {
    type: DataTypes.ENUM(
      'website',
      'portal',
      'booking',
      'payment',
      'api',
      'integration',
      'account',
      'technical',
      'other'
    ),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'waiting', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  assignedTo: {
    type: DataTypes.UUID,
    field: 'assigned_to',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resolvedAt: {
    type: DataTypes.DATE,
    field: 'resolved_at'
  },
  closedAt: {
    type: DataTypes.DATE,
    field: 'closed_at'
  },
  rating: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    }
  },
  feedback: {
    type: DataTypes.TEXT
  },
  attachments: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'support_tickets',
  timestamps: true,
  hooks: {
    beforeCreate: async (ticket) => {
      // Generate ticket number
      const count = await SupportTicket.count();
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      ticket.ticketNumber = `TKT-${year}${month}-${String(count + 1).padStart(6, '0')}`;
    }
  }
});

module.exports = SupportTicket;