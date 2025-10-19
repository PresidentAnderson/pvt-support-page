const express = require('express');
const router = express.Router();
const { SystemStatus } = require('../models');
const { protect, authorize } = require('../middleware/auth');

// Get all system statuses - public
router.get('/status', async (req, res) => {
  try {
    const statuses = await SystemStatus.findAll({
      order: [['service_name', 'ASC']]
    });
    
    res.json({ success: true, data: statuses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update system status - admin only
router.put('/status/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const status = await SystemStatus.findByPk(req.params.id);
    if (!status) {
      return res.status(404).json({ success: false, message: 'Status not found' });
    }
    
    await status.update(req.body);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;