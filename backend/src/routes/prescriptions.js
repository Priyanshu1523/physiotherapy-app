const express = require('express');
const router = express.Router();
const { memoryStore } = require('../db');

// GET /api/prescriptions
router.get('/', (req, res) => {
  const { patient_id, doctor_id } = req.query;
  let result = [...memoryStore.prescriptions];

  if (patient_id) {
    result = result.filter((p) => p.patient_id === parseInt(patient_id));
  }
  if (doctor_id) {
    result = result.filter((p) => p.doctor_id === parseInt(doctor_id));
  }

  res.json({ success: true, data: result });
});

// GET /api/prescriptions/:id
router.get('/:id', (req, res) => {
  const prId = parseInt(req.params.id);
  const prescription = memoryStore.prescriptions.find((p) => p.id === prId);

  if (!prescription) {
    return res.status(404).json({ success: false, message: 'Prescription not found' });
  }

  const patient = memoryStore.patients.find((p) => p.id === prescription.patient_id);
  const doctor = memoryStore.doctors.find((d) => d.id === prescription.doctor_id);

  res.json({
    success: true,
    data: {
      ...prescription,
      patient,
      doctor,
    },
  });
});

// POST /api/prescriptions
router.post('/', (req, res) => {
  const {
    appointment_id,
    patient_id,
    doctor_id,
    treatment_id,
    diagnosis,
    notes,
    medicines = [],
  } = req.body;

  const nextId = memoryStore.prescriptions.length + 1;
  const year = new Date().getFullYear();
  const sequenceNo = `RX-${year}-${String(nextId).padStart(3, '0')}`;

  const patient = memoryStore.patients.find((p) => p.id === parseInt(patient_id));
  const doctor = memoryStore.doctors.find((d) => d.id === parseInt(doctor_id));
  const treatment = memoryStore.treatments.find((t) => t.id === parseInt(treatment_id));

  const newPrescription = {
    id: nextId,
    sequence_no: sequenceNo,
    appointment_id: appointment_id ? parseInt(appointment_id) : null,
    patient_id: patient ? patient.id : 1,
    patient_name: patient ? patient.name : 'Patient',
    doctor_id: doctor ? doctor.id : 1,
    doctor_name: doctor ? doctor.name : 'Doctor',
    treatment_id: treatment ? treatment.id : null,
    treatment_name: treatment ? treatment.name : null,
    prescription_date: new Date().toISOString().split('T')[0],
    diagnosis: diagnosis || '',
    notes: notes || '',
    status: 'prescribed',
    medicines: medicines.map((m, idx) => ({
      id: idx + 1,
      medicine_name: m.medicine_name,
      dosage: m.dosage || '',
      frequency: m.frequency || '1-0-1',
      days: parseInt(m.days) || 5,
      instructions: m.instructions || 'After food',
    })),
    created_at: new Date().toISOString(),
  };

  memoryStore.prescriptions.unshift(newPrescription);

  // If treatment is assigned, add it to invoice lines or update existing appointment invoice
  if (treatment && appointment_id) {
    const inv = memoryStore.invoices.find((i) => i.appointment_id === parseInt(appointment_id));
    if (inv) {
      inv.prescription_id = newPrescription.id;
      inv.lines.push({
        description: `Prescribed Treatment - ${treatment.name}`,
        quantity: 1,
        unit_price: treatment.cost,
        total_price: treatment.cost,
      });
      inv.subtotal += treatment.cost;
      inv.total_amount = inv.subtotal + (inv.tax || 0) - (inv.discount || 0);
    }
  }

  res.status(201).json({ success: true, data: newPrescription });
});

module.exports = router;
