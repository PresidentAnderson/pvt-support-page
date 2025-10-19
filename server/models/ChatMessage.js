const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  roomId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'room_id',
    index: true
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  ticketId: {
    type: DataTypes.UUID,
    field: 'ticket_id',
    references: {
      model: 'support_tickets',
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('user', 'support', 'system', 'bot'),
    defaultValue: 'user'
  },
  attachments: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  readAt: {
    type: DataTypes.DATE,
    field: 'read_at'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'chat_messages',
  timestamps: true,
  indexes: [
    {
      fields: ['room_id', 'created_at']
    },
    {
      fields: ['ticket_id']
    }
  ]
});

module.exports = ChatMessage;