const User = require('./User');
const Organization = require('./Organization');
const MacRequest = require('./MacRequest');
const SupportTicket = require('./SupportTicket');
const SystemStatus = require('./SystemStatus');
const ChatMessage = require('./ChatMessage');

// Define relationships

// User - Organization
User.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
Organization.hasMany(User, { foreignKey: 'organizationId', as: 'users' });

// MacRequest relationships
MacRequest.belongsTo(User, { foreignKey: 'userId', as: 'requester' });
MacRequest.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
MacRequest.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

User.hasMany(MacRequest, { foreignKey: 'userId', as: 'macRequests' });
User.hasMany(MacRequest, { foreignKey: 'assignedTo', as: 'assignedMacRequests' });
Organization.hasMany(MacRequest, { foreignKey: 'organizationId', as: 'macRequests' });

// SupportTicket relationships
SupportTicket.belongsTo(User, { foreignKey: 'userId', as: 'requester' });
SupportTicket.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
SupportTicket.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

User.hasMany(SupportTicket, { foreignKey: 'userId', as: 'supportTickets' });
User.hasMany(SupportTicket, { foreignKey: 'assignedTo', as: 'assignedTickets' });
Organization.hasMany(SupportTicket, { foreignKey: 'organizationId', as: 'supportTickets' });

// ChatMessage relationships
ChatMessage.belongsTo(User, { foreignKey: 'userId', as: 'sender' });
ChatMessage.belongsTo(SupportTicket, { foreignKey: 'ticketId', as: 'ticket' });

User.hasMany(ChatMessage, { foreignKey: 'userId', as: 'chatMessages' });
SupportTicket.hasMany(ChatMessage, { foreignKey: 'ticketId', as: 'messages' });

module.exports = {
  User,
  Organization,
  MacRequest,
  SupportTicket,
  SystemStatus,
  ChatMessage
};