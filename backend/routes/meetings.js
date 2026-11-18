const express = require('express');
const router = express.Router();
const protect = require("../middleware/auth");
const {
  getMeetings,
  getMeeting,
  createMeeting,
  startMeeting,
  endMeeting,
  saveSummary,
  toggleActionItem,
  getAnalytics,
  deleteMeeting,
} = require('../controllers/meetingController');
const { analyzeMeeting } = require('../controllers/aiController');

// Order matters: specific paths before /:id
router.get('/analytics', protect, getAnalytics);
router.get('/', protect, getMeetings);
router.post('/', protect, createMeeting);
router.post('/:id/ai-analysis', protect, analyzeMeeting);
router.get('/:id', protect, getMeeting);
router.patch('/:id/start', protect, startMeeting);
router.patch('/:id/end', protect, endMeeting);
router.patch('/:id/summary', protect, saveSummary);
router.patch('/:id/action-items/:itemId/toggle', protect, toggleActionItem);
router.delete('/:id', protect, deleteMeeting);

module.exports = router;
