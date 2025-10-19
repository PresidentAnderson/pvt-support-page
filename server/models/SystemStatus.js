const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemStatus = sequelize.define('SystemStatus', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  serviceName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'service_name'
  },
  status: {
    type: DataTypes.ENUM('operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance'),
    defaultValue: 'operational'
  },
  description: {
    type: DataTypes.TEXT
  },
  affectedOrganizations: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    field: 'affected_organizations'
  },
  incidentStart: {
    type: DataTypes.DATE,
    field: 'incident_start'
  },
  incidentEnd: {
    type: DataTypes.DATE,
    field: 'incident_end'
  },
  lastChecked: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_checked'
  },
  uptime: {
    type: DataTypes.FLOAT,
    defaultValue: 100.0
  },
  responseTime: {
    type: DataTypes.INTEGER,
    field: 'response_time'
  },
  maintenanceScheduled: {
    type: DataTypes.DATE,
    field: 'maintenance_scheduled'
  },
  maintenanceEnd: {
    type: DataTypes.DATE,
    field: 'maintenance_end'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'system_status',
  timestamps: true
});

module.exports = SystemStatus;