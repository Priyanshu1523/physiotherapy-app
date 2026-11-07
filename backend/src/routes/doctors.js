const express = require('express');
const router = express.Router();
const { memoryStore } = require('../db');

// GET /api/doctors
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: memoryStore.doctors,
  });
});

// GET /api/doctors/:id
router.get('/:id', (req, res) => {
  const doctor = memoryStore.doctors.find((d) => d.id === parseInt(req.params.id));
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }
  res.json({ success: true, data: doctor });
});

// GET /api/doctors/:id/available-slots?date=YYYY-MM-DD
router.get('/:id/available-slots', (req, res) => {
  const doctorId = parseInt(req.params.id);
  const dateStr = req.query.date || new Date().toISOString().split('T')[0];

  const doctor = memoryStore.doctors.find((d) => d.id === doctorId);
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  // Determine day of week
  const dateObj = new Date(dateStr);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[dateObj.getDay()];

  if (doctor.working_days && !doctor.working_days.includes(dayName)) {
    return res.json({
      success: true,
      data: [],
      message: `${doctor.name} is not available on ${dayName}`,
    });
  }

  // Shifts for this doctor
  const doctorShifts = memoryStore.shifts.filter((s) => doctor.shifts.includes(s.id));

  // Existing appointments for this doctor on this date
  const bookedAppointments = memoryStore.appointments.filter(
    (a) =>
      a.doctor_id === doctorId &&
      a.appointment_date &&
      a.appointment_date.startsWith(dateStr) &&
      a.status !== 'cancelled'
  );

  const slots = [];

  doctorShifts.forEach((shift) => {
    // Generate 30-minute intervals between start_time and end_time
    const [startH, startM] = shift.start_time.split(':').map(Number);
    const [endH, endM] = shift.end_time.split(':').map(Number);

    let curMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (curMinutes + 30 <= endMinutes) {
      const h = Math.floor(curMinutes / 60);
      const m = curMinutes % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const endSlotH = Math.floor((curMinutes + 30) / 60);
      const endSlotM = (curMinutes + 30) % 60;
      const endTimeStr = `${String(endSlotH).padStart(2, '0')}:${String(endSlotM).padStart(2, '0')}`;

      // Check if slot overlaps with booked appointment
      const isBooked = bookedAppointments.some((appt) => {
        const apptTime = new Date(appt.appointment_date);
        const apptH = apptTime.getHours();
        const apptM = apptTime.getMinutes();
        return apptH === h && apptM === m;
      });

      slots.push({
        shift_id: shift.id,
        shift_name: shift.name,
        time: timeStr,
        end_time: endTimeStr,
        is_booked: isBooked,
      });

      curMinutes += 30;
    }
  });

  res.json({ success: true, data: slots });
});

// POST /api/doctors
router.post('/', (req, res) => {
  const { name, email, phone, specialization_id, registration_no, consultation_fee, bio, shifts, working_days } = req.body;
  const spec = memoryStore.specializations.find((s) => s.id === parseInt(specialization_id));

  const newDoctor = {
    id: memoryStore.doctors.length + 1,
    name,
    email,
    phone,
    specialization_id: parseInt(specialization_id) || 1,
    specialization_name: spec ? spec.name : 'Physiotherapist',
    registration_no: registration_no || `PHYS-${Math.floor(10000 + Math.random() * 90000)}`,
    date_of_birth: req.body.date_of_birth || '1985-01-01',
    experience_years: parseInt(req.body.experience_years) || 5,
    consultation_fee: parseFloat(consultation_fee) || 500.0,
    bio: bio || '',
    shifts: shifts || [1, 2],
    working_days: working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    is_active: true,
  };

  memoryStore.doctors.push(newDoctor);
  res.status(201).json({ success: true, data: newDoctor });
});

module.exports = router;
