const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getMacRequests,
  getMacRequest,
  createMacRequest,
  updateMacRequest,
  deleteMacRequest,
  getMacRequestStats
} = require('../controllers/macRequestController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules
const createValidation = [
  body('requestType').isIn(['move', 'add', 'change', 'remove']).withMessage('Invalid request type'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('description').notEmpty().trim().withMessage('Description is required')
];

// All routes require authentication
router.use(protect);

// Routes
router.get('/stats', getMacRequestStats);
router
  .route('/')
  .get(getMacRequests)
  .post(createValidation, createMacRequest);

router
  .route('/:id')
  .get(getMacRequest)
  .put(updateMacRequest)
  .delete(authorize('admin'), deleteMacRequest);

module.exports = router;