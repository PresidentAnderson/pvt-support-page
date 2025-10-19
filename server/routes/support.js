const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { SupportTicket, ChatMessage } = require('../models');

// Create support ticket
router.post('/tickets', protect, async (req, res) => {
  try {
    const ticket = await SupportTicket.create({
      ...req.body,
      userId: req.user.id,
      organizationId: req.user.organizationId
    });
    
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's tickets
router.get('/tickets', protect, async (req, res) => {
  try {
    const tickets = await SupportTicket.findAll({
      where: { userId: req.user.id },
      include: ['organization'],
      order: [['created_at', 'DESC']]
    });
    
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get chat messages for a ticket
router.get('/chat/:ticketId', protect, async (req, res) => {
  try {
    const messages = await ChatMessage.findAll({
      where: { ticketId: req.params.ticketId },
      include: ['sender'],
      order: [['created_at', 'ASC']]
    });
    
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send chat message
router.post('/chat', protect, async (req, res) => {
  try {
    const message = await ChatMessage.create({
      ...req.body,
      userId: req.user.id
    });
    
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;