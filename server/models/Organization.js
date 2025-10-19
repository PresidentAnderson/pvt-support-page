const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('hostel', 'hotel', 'studio', 'corporate'),
    defaultValue: 'hostel'
  },
  address: {
    type: DataTypes.STRING
  },
  city: {
    type: DataTypes.STRING
  },
  province: {
    type: DataTypes.STRING
  },
  postalCode: {
    type: DataTypes.STRING,
    field: 'postal_code'
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: 'Canada'
  },
  phone: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  website: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  logo: {
    type: DataTypes.STRING
  },
  primaryColor: {
    type: DataTypes.STRING,
    field: 'primary_color'
  },
  secondaryColor: {
    type: DataTypes.STRING,
    field: 'secondary_color'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'organizations',
  timestamps: true
});

module.exports = Organization;