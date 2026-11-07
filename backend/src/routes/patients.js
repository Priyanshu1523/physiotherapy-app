const express = require('express');
const router = express.Router();
const { memoryStore } = require('../db');

// GET /api/patients
router.get('/', (req, res) => {
  const { search, blood_group } = req.query;
  let result = [...memoryStore.patients];

  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.patient_code.toLowerCase().includes(s) ||
        p.phone.includes(s) ||
        (p.email && p.email.toLowerCase().includes(s))
    );
  }

  if (blood_group) {
    result = result.filter((p) => p.blood_group === blood_group);
  }

  res.json({ success: true, data: result });
});

// GET /api/patients/:id
router.get('/:id', (req, res) => {
  const patientId = parseInt(req.params.id);
  const patient = memoryStore.patients.find((p) => p.id === patientId);

  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  // Related data
  const appointments = memoryStore.appointments.filter((a) => a.patient_id === patientId);
  const prescriptions = memoryStore.prescriptions.filter((pr) => pr.patient_id === patientId);
  const invoices = memoryStore.invoices.filter((inv) => inv.patient_id === patientId);
  const xrays = memoryStore.xray_reports.filter((x) => x.patient_id === patientId);

  res.json({
    success: true,
    data: {
      ...patient,
      appointments,
      prescriptions,
      invoices,
      xrays,
    },
  });
});

// POST /api/patients
router.post('/', (req, res) => {
  const {
    name,
    email,
    phone,
    date_of_birth,
    gender,
    blood_group,
    address,
    emergency_contact_name,
    emergency_contact_phone,
    medical_history,
    allergies,
  } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone are required' });
  }

  let age = null;
  if (date_of_birth) {
    const birthYear = new Date(date_of_birth).getFullYear();
    const currentYear = new Date().getFullYear();
    age = currentYear - birthYear;
  }

  const nextId = memoryStore.patients.length + 1;
  const patientCode = `PAT-${String(nextId).padStart(3, '0')}`;

  const newPatient = {
    id: nextId,
    patient_code: patientCode,
    name,
    email: email || null,
    phone,
    date_of_birth: date_of_birth || null,
    age: age || req.body.age || 0,
    gender: gender || 'other',
    blood_group: blood_group || 'O+',
    address: address || '',
    emergency_contact_name: emergency_contact_name || '',
    emergency_contact_phone: emergency_contact_phone || '',
    medical_history: medical_history || '',
    allergies: allergies || 'None',
    created_at: new Date().toISOString(),
  };

  memoryStore.patients.unshift(newPatient);
  res.status(201).json({ success: true, data: newPatient });
});

// PUT /api/patients/:id
router.put('/:id', (req, res) => {
  const patientId = parseInt(req.params.id);
  const index = memoryStore.patients.findIndex((p) => p.id === patientId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  memoryStore.patients[index] = {
    ...memoryStore.patients[index],
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  res.json({ success: true, data: memoryStore.patients[index] });
});

module.exports = router;
