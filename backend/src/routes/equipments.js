const express = require('express');
const router = express.Router();
const { memoryStore } = require('../db');

// GET /api/equipments
router.get('/', (req, res) => {
  res.json({ success: true, data: memoryStore.equipments });
});

// POST /api/equipments
router.post('/', (req, res) => {
  const { name, model, serial_no, purchase_date, warranty_expiry, status, notes } = req.body;

  const nextId = memoryStore.equipments.length + 1;
  const newEquipment = {
    id: nextId,
    name,
    model: model || '',
    serial_no: serial_no || `SN-EQ-${Date.now().toString().slice(-6)}`,
    purchase_date: purchase_date || new Date().toISOString().split('T')[0],
    warranty_expiry: warranty_expiry || null,
    status: status || 'available',
    maintenance_interval_days: 90,
    last_maintenance_date: new Date().toISOString().split('T')[0],
    next_maintenance_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().split('T')[0],
    notes: notes || '',
  };

  memoryStore.equipments.push(newEquipment);
  res.status(201).json({ success: true, data: newEquipment });
});

// PATCH /api/equipments/:id/status
router.patch('/:id/status', (req, res) => {
  const eqId = parseInt(req.params.id);
  const eq = memoryStore.equipments.find((e) => e.id === eqId);

  if (!eq) {
    return res.status(404).json({ success: false, message: 'Equipment not found' });
  }

  eq.status = req.body.status || eq.status;
  if (req.body.last_maintenance_date) {
    eq.last_maintenance_date = req.body.last_maintenance_date;
  }
  res.json({ success: true, data: eq });
});

module.exports = router;
