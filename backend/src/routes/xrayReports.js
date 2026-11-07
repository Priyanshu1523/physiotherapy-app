const express = require('express');
const router = express.Router();
const { memoryStore } = require('../db');

// GET /api/xray-reports
router.get('/', (req, res) => {
  const { patient_id } = req.query;
  let result = [...memoryStore.xray_reports];

  if (patient_id) {
    result = result.filter((x) => x.patient_id === parseInt(patient_id));
  }

  res.json({ success: true, data: result });
});

// POST /api/xray-reports
router.post('/', (req, res) => {
  const { patient_id, doctor_id, test_type, report_date, findings, impression, remarks } = req.body;

  const patient = memoryStore.patients.find((p) => p.id === parseInt(patient_id));
  const doctor = memoryStore.doctors.find((d) => d.id === parseInt(doctor_id));

  const nextId = memoryStore.xray_reports.length + 1;
  const reportNo = `XRAY-${new Date().getFullYear()}-${String(nextId).padStart(3, '0')}`;

  const newReport = {
    id: nextId,
    report_no: reportNo,
    patient_id: patient ? patient.id : 1,
    patient_name: patient ? patient.name : 'Patient',
    doctor_id: doctor ? doctor.id : 1,
    doctor_name: doctor ? doctor.name : 'Doctor',
    test_type: test_type || 'General Diagnostic Imaging',
    report_date: report_date || new Date().toISOString().split('T')[0],
    findings: findings || '',
    impression: impression || '',
    remarks: remarks || '',
    attachment_url: null,
    created_at: new Date().toISOString(),
  };

  memoryStore.xray_reports.unshift(newReport);
  res.status(201).json({ success: true, data: newReport });
});

module.exports = router;
