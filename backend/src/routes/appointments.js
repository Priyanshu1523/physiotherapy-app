const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { memoryStore } = require('../db');

// Helper to generate DataURL QR code
async function generateQr(text) {
  try {
    return await QRCode.toDataURL(text, { width: 256, margin: 2 });
  } catch (err) {
    console.error('QR generation error:', err);
    return null;
  }
}

// GET /api/appointments
router.get('/', (req, res) => {
  const { status, doctor_id, patient_id, date } = req.query;
  let result = [...memoryStore.appointments];

  if (status) {
    result = result.filter((a) => a.status === status);
  }
  if (doctor_id) {
    result = result.filter((a) => a.doctor_id === parseInt(doctor_id));
  }
  if (patient_id) {
    result = result.filter((a) => a.patient_id === parseInt(patient_id));
  }
  if (date) {
    result = result.filter((a) => a.appointment_date && a.appointment_date.startsWith(date));
  }

  result.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

  res.json({ success: true, data: result });
});

// GET /api/appointments/verify/:code
// Verification endpoint for QR Scanner at clinic reception
router.get('/verify/:code', async (req, res) => {
  const code = req.params.code.trim();
  const appointment = memoryStore.appointments.find(
    (a) => a.appointment_no.toLowerCase() === code.toLowerCase()
  );

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Invalid QR Code or Appointment Not Found' });
  }

  const patient = memoryStore.patients.find((p) => p.id === appointment.patient_id);
  const doctor = memoryStore.doctors.find((d) => d.id === appointment.doctor_id);
  const invoice = memoryStore.invoices.find((i) => i.appointment_id === appointment.id);

  res.json({
    success: true,
    data: {
      ...appointment,
      patient,
      doctor,
      invoice,
    },
  });
});

// GET /api/appointments/:id
router.get('/:id', async (req, res) => {
  const apptId = parseInt(req.params.id);
  const appointment = memoryStore.appointments.find((a) => a.id === apptId);

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  const patient = memoryStore.patients.find((p) => p.id === appointment.patient_id);
  const doctor = memoryStore.doctors.find((d) => d.id === appointment.doctor_id);
  const prescription = memoryStore.prescriptions.find((pr) => pr.appointment_id === apptId);
  const invoice = memoryStore.invoices.find((inv) => inv.appointment_id === apptId);

  // Generate real QR code if not present
  if (!appointment.appointment_qr) {
    appointment.appointment_qr = await generateQr(`PHYSIO:${appointment.appointment_no}`);
  }

  res.json({
    success: true,
    data: {
      ...appointment,
      patient,
      doctor,
      prescription,
      invoice,
    },
  });
});

// POST /api/appointments
router.post('/', async (req, res) => {
  const {
    patient_id,
    doctor_id,
    shift_id,
    appointment_date,
    slot_duration = '30',
    urgency = 'normal',
    patient_category = 'existing',
    clinical_notes = '',
    patient_name,
    patient_phone,
    patient_email,
  } = req.body;

  let assignedPatientId = patient_id;

  if (!assignedPatientId && patient_name && patient_phone) {
    const nextPid = memoryStore.patients.length + 1;
    const newPat = {
      id: nextPid,
      patient_code: `PAT-${String(nextPid).padStart(3, '0')}`,
      name: patient_name,
      email: patient_email || null,
      phone: patient_phone,
      blood_group: 'O+',
      medical_history: clinical_notes || 'Booked via Online Portal',
      allergies: 'None',
      created_at: new Date().toISOString(),
    };
    memoryStore.patients.unshift(newPat);
    assignedPatientId = newPat.id;
  }

  const patient = memoryStore.patients.find((p) => p.id === parseInt(assignedPatientId));
  const doctor = memoryStore.doctors.find((d) => d.id === parseInt(doctor_id));

  if (!doctor) {
    return res.status(400).json({ success: false, message: 'Valid doctor is required' });
  }

  const shift = memoryStore.shifts.find((s) => s.id === parseInt(shift_id)) || memoryStore.shifts[0];

  const nextApptId = memoryStore.appointments.length + 1;
  const year = new Date().getFullYear();
  const appointmentNo = `APP-${year}-${String(nextApptId).padStart(3, '0')}`;

  const startDate = new Date(appointment_date || Date.now());
  const durationMins = parseInt(slot_duration) || 30;
  const endDate = new Date(startDate.getTime() + durationMins * 60000);

  const zoomUrl = `https://zoom.us/j/physio-${appointmentNo.toLowerCase()}`;

  // Generate real QR code for this appointment
  const qrDataUrl = await generateQr(`PHYSIO:${appointmentNo}`);

  const newAppointment = {
    id: nextApptId,
    appointment_no: appointmentNo,
    patient_id: patient ? patient.id : 1,
    patient_name: patient ? patient.name : patient_name || 'Patient',
    doctor_id: doctor.id,
    doctor_name: doctor.name,
    shift_id: shift ? shift.id : 1,
    shift_name: shift ? shift.name : 'Morning Shift',
    appointment_date: startDate.toISOString(),
    appointment_end: endDate.toISOString(),
    slot_duration: String(durationMins),
    urgency,
    patient_category: patient ? 'existing' : 'new',
    status: 'confirmed',
    consultation_fee: doctor.consultation_fee || 500.0,
    zoom_meeting_url: zoomUrl,
    clinical_notes: clinical_notes || '',
    appointment_qr: qrDataUrl,
    created_at: new Date().toISOString(),
  };

  memoryStore.appointments.unshift(newAppointment);

  res.status(201).json({ success: true, data: newAppointment });
});

// PATCH /api/appointments/:id/status
router.patch('/:id/status', (req, res) => {
  const apptId = parseInt(req.params.id);
  const { status } = req.body;
  const validStatuses = ['draft', 'confirmed', 'in_progress', 'done', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const appt = memoryStore.appointments.find((a) => a.id === apptId);
  if (!appt) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  appt.status = status;
  appt.updated_at = new Date().toISOString();

  if (status === 'done') {
    const existingInv = memoryStore.invoices.find((i) => i.appointment_id === apptId);
    if (!existingInv) {
      const nextInvId = memoryStore.invoices.length + 1;
      const year = new Date().getFullYear();
      const invNo = `INV-${year}-${String(nextInvId).padStart(3, '0')}`;

      const doctor = memoryStore.doctors.find((d) => d.id === appt.doctor_id);
      const fee = appt.consultation_fee || (doctor ? doctor.consultation_fee : 500);

      const newInv = {
        id: nextInvId,
        invoice_no: invNo,
        appointment_id: appt.id,
        prescription_id: null,
        patient_id: appt.patient_id,
        patient_name: appt.patient_name,
        doctor_id: appt.doctor_id,
        doctor_name: appt.doctor_name,
        subtotal: fee,
        tax: 0,
        discount: 0,
        total_amount: fee,
        paid_amount: 0,
        status: 'unpaid',
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0],
        notes: `Consultation fee for ${appt.appointment_no}`,
        lines: [
          { description: `Consultation - ${appt.doctor_name}`, quantity: 1, unit_price: fee, total_price: fee },
        ],
        payments: [],
        created_at: new Date().toISOString(),
      };
      memoryStore.invoices.unshift(newInv);
    }
  }

  res.json({ success: true, data: appt });
});

module.exports = router;
