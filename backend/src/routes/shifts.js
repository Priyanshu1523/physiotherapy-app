const express = require('express');
const router = express.Router();
const { memoryStore } = require('../db');

// GET /api/shifts
router.get('/', (req, res) => {
  res.json({ success: true, data: memoryStore.shifts });
});

// GET /api/shifts/specializations
router.get('/specializations', (req, res) => {
  res.json({ success: true, data: memoryStore.specializations });
});

module.exports = router;
