const express = require('express');
const router = express.Router();
const { memoryStore } = require('../db');

// GET /api/treatments
router.get('/', (req, res) => {
  const { category_id } = req.query;
  let result = [...memoryStore.treatments];

  if (category_id) {
    result = result.filter((t) => t.category_id === parseInt(category_id));
  }

  res.json({ success: true, data: result });
});

// GET /api/treatments/categories
router.get('/categories', (req, res) => {
  res.json({ success: true, data: memoryStore.treatment_categories });
});

// GET /api/treatments/medicines
router.get('/medicines', (req, res) => {
  res.json({ success: true, data: memoryStore.medicines });
});

// POST /api/treatments/medicines (Add new medicine to clinic inventory - Odoo medical.medicine)
router.post('/medicines', (req, res) => {
  const { name, dosage, form = 'Tablet', manufacturer = 'Pharma', notes = '', price = 150 } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Medicine name is required' });
  }

  const newMedicine = {
    id: memoryStore.medicines.length + 1,
    name,
    dosage: dosage || 'Standard',
    form,
    manufacturer,
    notes: notes || '',
    price: parseFloat(price) || 120.0,
    created_at: new Date().toISOString(),
  };

  memoryStore.medicines.unshift(newMedicine);
  res.status(201).json({ success: true, data: newMedicine });
});

// DELETE /api/treatments/medicines/:id
router.delete('/medicines/:id', (req, res) => {
  const medId = parseInt(req.params.id);
  const index = memoryStore.medicines.findIndex((m) => m.id === medId);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Medicine not found' });
  }
  memoryStore.medicines.splice(index, 1);
  res.json({ success: true, message: 'Medicine removed successfully' });
});

// GET /api/treatments/frequencies
router.get('/frequencies', (req, res) => {
  res.json({ success: true, data: memoryStore.medicine_frequencies });
});

// POST /api/treatments
router.post('/', (req, res) => {
  const { name, category_id, description, cost, duration_minutes } = req.body;
  const category = memoryStore.treatment_categories.find((c) => c.id === parseInt(category_id));

  const newTreatment = {
    id: memoryStore.treatments.length + 1,
    name,
    category_id: parseInt(category_id) || 1,
    category_name: category ? category.name : 'General Therapy',
    description: description || '',
    cost: parseFloat(cost) || 0.0,
    duration_minutes: parseInt(duration_minutes) || 30,
    created_at: new Date().toISOString(),
  };

  memoryStore.treatments.push(newTreatment);
  res.status(201).json({ success: true, data: newTreatment });
});

module.exports = router;
