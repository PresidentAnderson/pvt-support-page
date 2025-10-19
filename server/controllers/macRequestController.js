const { MacRequest, User, Organization } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// @desc    Get all MAC requests
// @route   GET /api/mac-requests
// @access  Private
exports.getMacRequests = async (req, res) => {
  try {
    const { status, priority, organizationId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    
    // Filter by user's organization if not admin
    if (req.user.role !== 'admin') {
      where.organizationId = req.user.organizationId;
    } else if (organizationId) {
      where.organizationId = organizationId;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const { count, rows: macRequests } = await MacRequest.findAndCountAll({
      where,
      include: [
        { association: 'requester', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'organization', attributes: ['id', 'name', 'code'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      data: macRequests
    });
  } catch (error) {
    console.error('Get MAC requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching MAC requests'
    });
  }
};

// @desc    Get single MAC request
// @route   GET /api/mac-requests/:id
// @access  Private
exports.getMacRequest = async (req, res) => {
  try {
    const macRequest = await MacRequest.findByPk(req.params.id, {
      include: [
        { association: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { association: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'organization' }
      ]
    });

    if (!macRequest) {
      return res.status(404).json({
        success: false,
        message: 'MAC request not found'
      });
    }

    // Check if user can access this request
    if (req.user.role !== 'admin' && req.user.role !== 'support') {
      if (macRequest.userId !== req.user.id && macRequest.organizationId !== req.user.organizationId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this request'
        });
      }
    }

    res.json({
      success: true,
      data: macRequest
    });
  } catch (error) {
    console.error('Get MAC request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching MAC request'
    });
  }
};

// @desc    Create MAC request
// @route   POST /api/mac-requests
// @access  Private
exports.createMacRequest = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      organizationId,
      requestType,
      priority,
      title,
      description,
      affectedSystems
    } = req.body;

    // Use user's organization if not specified or not admin
    const finalOrganizationId = (req.user.role === 'admin' && organizationId) 
      ? organizationId 
      : req.user.organizationId;

    if (!finalOrganizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization is required'
      });
    }

    const macRequest = await MacRequest.create({
      organizationId: finalOrganizationId,
      userId: req.user.id,
      requestType,
      priority: priority || 'medium',
      title,
      description,
      affectedSystems: affectedSystems || [],
      status: 'pending'
    });

    // Reload with associations
    const createdRequest = await MacRequest.findByPk(macRequest.id, {
      include: [
        { association: 'requester', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'organization', attributes: ['id', 'name', 'code'] }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdRequest
    });
  } catch (error) {
    console.error('Create MAC request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating MAC request'
    });
  }
};

// @desc    Update MAC request
// @route   PUT /api/mac-requests/:id
// @access  Private (Admin/Support)
exports.updateMacRequest = async (req, res) => {
  try {
    const macRequest = await MacRequest.findByPk(req.params.id);

    if (!macRequest) {
      return res.status(404).json({
        success: false,
        message: 'MAC request not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.role !== 'support') {
      if (macRequest.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this request'
        });
      }
      // Regular users can only update certain fields
      const allowedFields = ['description', 'affectedSystems'];
      Object.keys(req.body).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete req.body[key];
        }
      });
    }

    // Handle status changes
    if (req.body.status) {
      if (req.body.status === 'completed') {
        req.body.completedAt = new Date();
        req.body.actualCompletion = new Date();
      } else if (req.body.status === 'cancelled') {
        req.body.cancelledAt = new Date();
        req.body.cancellationReason = req.body.cancellationReason || 'No reason provided';
      }
    }

    // Update the request
    await macRequest.update(req.body);

    // Reload with associations
    const updatedRequest = await MacRequest.findByPk(macRequest.id, {
      include: [
        { association: 'requester', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'organization', attributes: ['id', 'name', 'code'] }
      ]
    });

    res.json({
      success: true,
      data: updatedRequest
    });
  } catch (error) {
    console.error('Update MAC request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating MAC request'
    });
  }
};

// @desc    Delete MAC request
// @route   DELETE /api/mac-requests/:id
// @access  Private (Admin only)
exports.deleteMacRequest = async (req, res) => {
  try {
    const macRequest = await MacRequest.findByPk(req.params.id);

    if (!macRequest) {
      return res.status(404).json({
        success: false,
        message: 'MAC request not found'
      });
    }

    await macRequest.destroy();

    res.json({
      success: true,
      message: 'MAC request deleted successfully'
    });
  } catch (error) {
    console.error('Delete MAC request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting MAC request'
    });
  }
};

// @desc    Get MAC request statistics
// @route   GET /api/mac-requests/stats
// @access  Private
exports.getMacRequestStats = async (req, res) => {
  try {
    const where = {};
    
    // Filter by organization for non-admin users
    if (req.user.role !== 'admin') {
      where.organizationId = req.user.organizationId;
    }

    // Get counts by status
    const statusCounts = await MacRequest.findAll({
      where,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count']
      ],
      group: ['status']
    });

    // Get counts by priority
    const priorityCounts = await MacRequest.findAll({
      where,
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('priority')), 'count']
      ],
      group: ['priority']
    });

    // Get recent requests
    const recentRequests = await MacRequest.findAll({
      where,
      include: [
        { association: 'requester', attributes: ['firstName', 'lastName'] },
        { association: 'organization', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        statusCounts,
        priorityCounts,
        recentRequests
      }
    });
  } catch (error) {
    console.error('Get MAC request stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching MAC request statistics'
    });
  }
};