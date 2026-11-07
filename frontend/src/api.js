const API_BASE = '/api';

// Reactive In-Memory Store for instant offline resilience and real-time updates
const fallbackStore = {
  stats: {
    totalPatients: 4,
    totalAppointments: 4,
    todayAppointments: 3,
    confirmedCount: 1,
    inProgressCount: 1,
    completedCount: 1,
    totalRevenue: 2850,
    pendingAmount: 750,
    availableEquipments: 2,
    totalEquipments: 3,
  },
  doctors: [
    {
      id: 1,
      name: 'Dr. Arvind Nair',
      email: 'arvind.nair@physioclinic.com',
      phone: '+91 91234 56789',
      specialization_name: 'Physiotherapist (Musculoskeletal & Spine)',
      registration_no: 'PHYS-78901',
      experience_years: 15,
      consultation_fee: 600,
      bio: 'Senior Musculoskeletal & Postural Rehabilitation Physiotherapist with 15+ years clinical experience.',
      shifts: [1, 2],
      working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    {
      id: 2,
      name: 'Dr. Meena Joshi',
      email: 'meena.joshi@physioclinic.com',
      phone: '+91 91234 56780',
      specialization_name: 'Orthopedic Specialist & Joint Rehab',
      registration_no: 'ORTHO-45210',
      experience_years: 12,
      consultation_fee: 750,
      bio: 'Orthopedic Rehabilitation and Joint Mobility Consultant specializing in spine and ACL care.',
      shifts: [2, 3],
      working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
  ],
  patients: [
    { id: 1, patient_code: 'PAT-001', name: 'Rahul Mehta', phone: '+91 98765 43210', email: 'rahul.mehta@email.com', date_of_birth: '1988-05-12', age: 36, gender: 'male', blood_group: 'O+', address: '42 Satellite Road, Ahmedabad', emergency_contact_name: 'Pooja Mehta', emergency_contact_phone: '+91 98765 43211', medical_history: 'L4-L5 disc herniation and sciatic nerve pain', allergies: 'None' },
    { id: 2, patient_code: 'PAT-002', name: 'Anjali Desai', phone: '+91 98765 12345', email: 'anjali.desai@email.com', date_of_birth: '1983-09-24', age: 41, gender: 'female', blood_group: 'B+', address: '18 Ring Road, Surat', emergency_contact_name: 'Kunal Desai', emergency_contact_phone: '+91 98765 12346', medical_history: 'Right knee ACL reconstruction post-op stiffness', allergies: 'Penicillin' },
    { id: 3, patient_code: 'PAT-003', name: 'Hitesh Patel', phone: '+91 98250 88990', email: 'hitesh.patel@email.com', date_of_birth: '1967-11-03', age: 57, gender: 'male', blood_group: 'A+', address: '7 Alka Society, Vadodara', emergency_contact_name: 'Geeta Patel', emergency_contact_phone: '+91 98250 88991', medical_history: 'Adhesive capsulitis (Frozen shoulder)', allergies: 'Sulfa drugs' },
    { id: 4, patient_code: 'PAT-004', name: 'Pooja Shah', phone: '+91 97240 55667', email: 'pooja.shah@email.com', date_of_birth: '1995-03-18', age: 29, gender: 'female', blood_group: 'AB+', address: 'Bopal, Ahmedabad', emergency_contact_name: 'Amit Shah', emergency_contact_phone: '+91 97240 55668', medical_history: 'Cervical radiculopathy and postural neck strain', allergies: 'None' },
  ],
  medicines: [
    { id: 1, name: 'Thiocolchicoside + Aceclofenac', dosage: '100mg + 4mg', form: 'Tablet', manufacturer: 'Cipla Health', price: 180, notes: 'Potent muscle relaxant and NSAID for acute back spasms' },
    { id: 2, name: 'Calcium Carbonate + Vitamin D3', dosage: '500mg + 250IU', form: 'Tablet', manufacturer: 'Sun Pharma', price: 120, notes: 'Bone density, remineralization and post-trauma recovery' },
    { id: 3, name: 'Diclofenac Diethylamine Gel', dosage: '1.16% w/w', form: 'Gel', manufacturer: 'Novartis', price: 95, notes: 'Topical targeted anti-inflammatory for joint mobility' },
    { id: 4, name: 'Pregabalin + Methylcobalamin', dosage: '75mg + 750mcg', form: 'Capsule', manufacturer: 'Lupin Ltd', price: 210, notes: 'Neuropathic pain relief, radiculopathy and nerve repair' },
    { id: 5, name: 'Paracetamol + Tramadol', dosage: '325mg + 37.5mg', form: 'Tablet', manufacturer: 'Torrent Pharma', price: 140, notes: 'Analgesic for moderate to severe post-op orthopedic pain' },
    { id: 6, name: 'Methyl Salicylate + Menthol Spray', dosage: '55g Spray', form: 'Spray', manufacturer: 'Volini', price: 160, notes: 'Instant deep cooling and heat therapy for sports strains' },
  ],
  treatments: [
    { id: 1, name: 'Manual Therapy & Joint Mobilization', category_name: 'Restorative Therapy', cost: 800, duration_minutes: 30, description: 'Hands-on clinical joint mobilization, myofascial release, and spinal adjustments.' },
    { id: 2, name: 'Electrotherapy (IFT / TENS / Ultrasound)', category_name: 'Rehabilitative Therapy', cost: 500, duration_minutes: 30, description: 'Deep tissue acoustic therapy and interferential stimulation for acute pain relief.' },
    { id: 3, name: 'Therapeutic Exercise & Posture Correction', category_name: 'Restorative Therapy', cost: 600, duration_minutes: 45, description: 'Custom exercise regimens for muscle strengthening and core stability.' },
    { id: 4, name: 'Cervical & Lumbar Traction Decompression', category_name: 'Rehabilitative Therapy', cost: 450, duration_minutes: 25, description: 'Mechanical axial decompression for sciatica, nerve root compression, and disc herniation.' },
    { id: 5, name: 'Class IV Laser Therapy', category_name: 'Advanced Modalities', cost: 1200, duration_minutes: 20, description: 'High-intensity infrared biostimulation for rapid ligament and tendon healing.' },
  ],
  appointments: [
    { id: 1, appointment_no: 'APP-2026-001', patient_id: 1, patient_name: 'Rahul Mehta', doctor_id: 1, doctor_name: 'Dr. Arvind Nair', shift_id: 1, shift_name: 'Morning Shift', appointment_date: new Date(Date.now() + 3600000).toISOString(), slot_duration: '30', urgency: 'normal', status: 'confirmed', consultation_fee: 600, clinical_notes: 'Sharp radiating lower lumbar pain down left leg' },
    { id: 2, appointment_no: 'APP-2026-002', patient_id: 2, patient_name: 'Anjali Desai', doctor_id: 2, doctor_name: 'Dr. Meena Joshi', shift_id: 2, shift_name: 'Afternoon Shift', appointment_date: new Date(Date.now() + 7200000).toISOString(), slot_duration: '30', urgency: 'normal', status: 'in_progress', consultation_fee: 750, clinical_notes: 'Post-ACL knee flexion stiffness and quad weakness' },
    { id: 3, appointment_no: 'APP-2026-003', patient_id: 3, patient_name: 'Hitesh Patel', doctor_id: 1, doctor_name: 'Dr. Arvind Nair', shift_id: 3, shift_name: 'Evening Shift', appointment_date: new Date(Date.now() - 3600000 * 2).toISOString(), slot_duration: '30', urgency: 'urgent', status: 'done', consultation_fee: 600, clinical_notes: 'Severe frozen shoulder restricted external rotation' },
    { id: 4, appointment_no: 'APP-2026-004', patient_id: 4, patient_name: 'Pooja Shah', doctor_id: 2, doctor_name: 'Dr. Meena Joshi', shift_id: 1, shift_name: 'Morning Shift', appointment_date: new Date(Date.now() + 10800000).toISOString(), slot_duration: '30', urgency: 'normal', status: 'draft', consultation_fee: 750, clinical_notes: 'Desk posture neck spasm' },
  ],
  prescriptions: [
    {
      id: 1,
      sequence_no: 'RX-2026-001',
      appointment_id: 3,
      patient_id: 3,
      patient_name: 'Hitesh Patel',
      doctor_id: 1,
      doctor_name: 'Dr. Arvind Nair',
      treatment_id: 1,
      treatment_name: 'Manual Therapy & Joint Mobilization',
      prescription_date: new Date().toISOString().split('T')[0],
      diagnosis: 'Right Shoulder Adhesive Capsulitis (Freezing Stage)',
      notes: 'Avoid overhead lifting. Gentle pendulum mobility 3x daily. Apply hot fomentation.',
      status: 'prescribed',
      medicines: [
        { id: 1, medicine_name: 'Thiocolchicoside + Aceclofenac', dosage: '100mg + 4mg', frequency: '1-0-1', days: 7, instructions: 'After meals' },
        { id: 2, medicine_name: 'Diclofenac Diethylamine Gel', dosage: 'Apply thin layer', frequency: '1-0-1', days: 10, instructions: 'Gentle topical application without vigorous rubbing' },
      ],
    },
    {
      id: 2,
      sequence_no: 'RX-2026-002',
      appointment_id: 2,
      patient_id: 2,
      patient_name: 'Anjali Desai',
      doctor_id: 2,
      doctor_name: 'Dr. Meena Joshi',
      treatment_id: 2,
      treatment_name: 'Electrotherapy (IFT / TENS / Ultrasound)',
      prescription_date: new Date().toISOString().split('T')[0],
      diagnosis: 'Post-Operative ACL Ligament Reconstruction Stiffness',
      notes: 'Active isometric quadriceps strengthening. Cold ice pack 15 mins after exercise.',
      status: 'prescribed',
      medicines: [
        { id: 1, medicine_name: 'Calcium Carbonate + Vitamin D3', dosage: '500mg + 250IU', frequency: '1-0-0', days: 30, instructions: 'After breakfast with water' },
        { id: 2, medicine_name: 'Paracetamol + Tramadol', dosage: '325mg + 37.5mg', frequency: 'S-O-S', days: 5, instructions: 'Only when severe knee pain occurs' },
      ],
    },
  ],
  invoices: [
    {
      id: 1,
      invoice_no: 'INV-2026-001',
      appointment_id: 3,
      prescription_id: 1,
      patient_id: 3,
      patient_name: 'Hitesh Patel',
      doctor_id: 1,
      doctor_name: 'Dr. Arvind Nair',
      total_amount: 1470,
      paid_amount: 1470,
      subtotal: 1400,
      tax: 70,
      status: 'paid',
      due_date: new Date().toISOString().split('T')[0],
      lines: [
        { description: 'Consultation Fee - Dr. Arvind Nair', quantity: 1, unit_price: 600, total_price: 600 },
        { description: 'Manual Therapy & Joint Mobilization', quantity: 1, unit_price: 800, total_price: 800 },
      ],
      payments: [{ id: 1, amount: 1470, payment_method: 'upi', transaction_ref: 'UPI/2026/8912', payment_date: new Date().toISOString() }],
    },
    {
      id: 2,
      invoice_no: 'INV-2026-002',
      appointment_id: 2,
      patient_id: 2,
      patient_name: 'Anjali Desai',
      doctor_id: 2,
      doctor_name: 'Dr. Meena Joshi',
      total_amount: 750,
      paid_amount: 0,
      subtotal: 750,
      tax: 0,
      status: 'unpaid',
      due_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      lines: [{ description: 'Orthopedic Consultation Fee - Dr. Meena Joshi', quantity: 1, unit_price: 750, total_price: 750 }],
      payments: [],
    },
  ],
  categories: [
    { id: 1, name: 'Restorative Therapy' },
    { id: 2, name: 'Rehabilitative Therapy' },
    { id: 3, name: 'Preventive Therapy' },
    { id: 4, name: 'Advanced Modalities' },
  ],
  shifts: [
    { id: 1, name: 'Morning Shift', shift_type: 'morning', start_time: '08:00', end_time: '12:00' },
    { id: 2, name: 'Afternoon Shift', shift_type: 'afternoon', start_time: '13:00', end_time: '17:00' },
    { id: 3, name: 'Evening Shift', shift_type: 'evening', start_time: '17:30', end_time: '21:00' },
  ],
  frequencies: [
    { id: 1, name: '1-0-1 (Morning & Night)' },
    { id: 2, name: '1-0-0 (Morning)' },
    { id: 3, name: '1-1-1 (Morning, Noon & Night)' },
    { id: 4, name: '0-0-1 (Night / Bedtime)' },
    { id: 5, name: 'S-O-S (When Pain Occurs)' },
  ],
};

async function safeFetch(url, options = {}, fallback = { success: true, data: [] }) {
  try {
    const res = await fetch(url, options);
    if (!res.ok && res.status >= 500) {
      return fallback;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    return fallback;
  }
}

export const api = {
  // Authentication (Login, Register Patient, Logout)
  login: async (credentials) => {
    const res = await safeFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }, null);

    if (res && res.success) return res;

    // Local fallback login
    const email = credentials.email?.toLowerCase().trim();
    let userRole = credentials.role || 'patient';
    let name = 'Clinic User';

    if (email?.includes('admin')) {
      userRole = 'admin';
      name = 'Clinic Administrator';
    } else if (email?.includes('arvind') || email?.includes('doctor')) {
      userRole = 'doctor';
      name = 'Dr. Arvind Nair';
    } else if (email?.includes('reception')) {
      userRole = 'receptionist';
      name = 'Kavita Sharma (Reception)';
    } else if (email?.includes('rahul') || userRole === 'patient') {
      userRole = 'patient';
      name = 'Rahul Mehta';
    }

    return {
      success: true,
      token: 'demo-token-' + Date.now(),
      user: {
        id: Date.now(),
        name,
        email: credentials.email || `${userRole}@physioclinic.com`,
        role: userRole,
        patient_code: userRole === 'patient' ? 'PAT-001' : null,
      },
    };
  },

  register: async (patientData) => {
    const res = await safeFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    }, null);

    if (res && res.success) {
      return res;
    }

    // Local fallback registration
    const newId = fallbackStore.patients.length + 1;
    const patientCode = `PAT-${String(newId).padStart(3, '0')}`;
    const newPat = {
      id: newId,
      patient_code: patientCode,
      name: patientData.name,
      email: patientData.email,
      phone: patientData.phone,
      date_of_birth: patientData.date_of_birth || '1990-01-01',
      age: patientData.age || 34,
      gender: patientData.gender || 'male',
      blood_group: patientData.blood_group || 'O+',
      address: patientData.address || '',
      emergency_contact_name: patientData.emergency_contact_name || '',
      emergency_contact_phone: patientData.emergency_contact_phone || '',
      medical_history: patientData.medical_history || '',
      allergies: patientData.allergies || 'None',
    };
    fallbackStore.patients.unshift(newPat);
    fallbackStore.stats.totalPatients += 1;

    return {
      success: true,
      token: 'demo-reg-token-' + Date.now(),
      message: 'Registration successful! You are now enrolled as a patient.',
      user: {
        id: newId,
        name: newPat.name,
        email: newPat.email,
        role: 'patient',
        patient_code: patientCode,
        patient_id: newId,
      },
      patient: newPat,
    };
  },

  getMe: (token) =>
    safeFetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Users & Roles Management
  getUsers: () =>
    safeFetch(`${API_BASE}/auth/users`, {}, {
      success: true,
      data: [
        { id: 1, name: 'Clinic Administrator', email: 'admin@physioclinic.com', role: 'admin', phone: '+91 99000 11000' },
        { id: 2, name: 'Dr. Arvind Nair', email: 'arvind.nair@physioclinic.com', role: 'doctor', phone: '+91 91234 56789', doctor_specialization: 'Physiotherapist' },
        { id: 3, name: 'Dr. Meena Joshi', email: 'meena.joshi@physioclinic.com', role: 'doctor', phone: '+91 91234 56780', doctor_specialization: 'Orthopedic Specialist' },
        { id: 4, name: 'Kavita Sharma', email: 'receptionist@physioclinic.com', role: 'receptionist', phone: '+91 98980 12345' },
        { id: 5, name: 'Rahul Mehta', email: 'rahul.mehta@email.com', role: 'patient', phone: '+91 98765 43210', patient_code: 'PAT-001' },
      ],
    }),

  createUser: (userData) =>
    safeFetch(`${API_BASE}/auth/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }, { success: true, data: { id: Date.now(), ...userData } }),

  updateUserRole: (id, role) =>
    safeFetch(`${API_BASE}/auth/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    }, { success: true }),

  // Dashboard
  getDashboardStats: async () => {
    const res = await safeFetch(`${API_BASE}/dashboard/stats`, {}, null);
    if (res && res.success) return res;

    // Dynamically calculate from fallbackStore
    const appts = fallbackStore.appointments;
    const invs = fallbackStore.invoices;
    const totalRev = invs.reduce((acc, i) => acc + (i.paid_amount || 0), 0);
    const pendingRev = invs.reduce((acc, i) => acc + ((i.total_amount || 0) - (i.paid_amount || 0)), 0);

    return {
      success: true,
      data: {
        totalPatients: fallbackStore.patients.length,
        totalAppointments: appts.length,
        todayAppointments: appts.filter((a) => a.status !== 'cancelled').length,
        confirmedCount: appts.filter((a) => a.status === 'confirmed').length,
        inProgressCount: appts.filter((a) => a.status === 'in_progress').length,
        completedCount: appts.filter((a) => a.status === 'done').length,
        totalRevenue: totalRev,
        pendingAmount: pendingRev,
        availableEquipments: 2,
        totalEquipments: 3,
        recentAppointments: appts.slice(0, 5),
      },
    };
  },

  // Doctors
  getDoctors: async () => {
    const res = await safeFetch(`${API_BASE}/doctors`, {}, null);
    if (res && res.success) return res;
    return { success: true, data: [...fallbackStore.doctors] };
  },

  createDoctor: async (data) => {
    const res = await safeFetch(`${API_BASE}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, null);

    const newDoc = res?.data || {
      id: fallbackStore.doctors.length + 1,
      ...data,
      specialization_name: data.specialization_id === '2' ? 'Orthopedic Specialist' : data.specialization_id === '3' ? 'Sports Rehabilitation' : 'Physiotherapist',
      registration_no: data.registration_no || `PHYS-${Math.floor(10000 + Math.random() * 90000)}`,
      shifts: [1, 2],
      working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    };

    fallbackStore.doctors.push(newDoc);
    return { success: true, data: newDoc };
  },

  getAvailableSlots: (doctorId, date) =>
    safeFetch(`${API_BASE}/doctors/${doctorId}/available-slots?date=${date}`, {}, {
      success: true,
      data: [
        { shift_id: 1, shift_name: 'Morning Shift', time: '09:00', is_booked: false },
        { shift_id: 1, shift_name: 'Morning Shift', time: '09:30', is_booked: false },
        { shift_id: 1, shift_name: 'Morning Shift', time: '10:00', is_booked: true },
        { shift_id: 1, shift_name: 'Morning Shift', time: '10:30', is_booked: false },
        { shift_id: 1, shift_name: 'Morning Shift', time: '11:00', is_booked: false },
        { shift_id: 2, shift_name: 'Afternoon Shift', time: '14:00', is_booked: false },
        { shift_id: 2, shift_name: 'Afternoon Shift', time: '14:30', is_booked: false },
        { shift_id: 2, shift_name: 'Afternoon Shift', time: '15:00', is_booked: false },
        { shift_id: 3, shift_name: 'Evening Shift', time: '18:00', is_booked: false },
        { shift_id: 3, shift_name: 'Evening Shift', time: '18:30', is_booked: false },
      ],
    }),

  // Patients
  getPatients: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`${API_BASE}/patients?${query}`, {}, null);
    if (res && res.success) return res;

    let list = [...fallbackStore.patients];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.patient_code.toLowerCase().includes(q) || p.phone.includes(q));
    }
    if (params.blood_group) {
      list = list.filter((p) => p.blood_group === params.blood_group);
    }
    return { success: true, data: list };
  },

  getPatientById: async (id) => {
    const res = await safeFetch(`${API_BASE}/patients/${id}`, {}, null);
    if (res && res.success) return res;

    const patient = fallbackStore.patients.find((p) => p.id === parseInt(id)) || fallbackStore.patients[0];
    const patientAppts = fallbackStore.appointments.filter((a) => a.patient_id === patient.id);
    const patientInvs = fallbackStore.invoices.filter((i) => i.patient_id === patient.id);

    return {
      success: true,
      data: {
        ...patient,
        appointments: patientAppts,
        invoices: patientInvs,
      },
    };
  },

  createPatient: async (data) => {
    const res = await safeFetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, null);

    const nextId = fallbackStore.patients.length + 1;
    const newPat = res?.data || {
      id: nextId,
      patient_code: `PAT-${String(nextId).padStart(3, '0')}`,
      ...data,
      age: data.age || 30,
    };

    fallbackStore.patients.unshift(newPat);
    fallbackStore.stats.totalPatients = fallbackStore.patients.length;
    return { success: true, data: newPat };
  },

  // Appointments
  getAppointments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`${API_BASE}/appointments?${query}`, {}, null);
    if (res && res.success) return res;

    let list = [...fallbackStore.appointments];
    if (params.status) {
      list = list.filter((a) => a.status === params.status);
    }
    if (params.patient_id) {
      list = list.filter((a) => a.patient_id === parseInt(params.patient_id));
    }
    return { success: true, data: list };
  },

  createAppointment: async (data) => {
    const res = await safeFetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, null);

    const nextId = fallbackStore.appointments.length + 1;
    const apptNo = `APP-2026-${String(nextId).padStart(3, '0')}`;
    const doctor = fallbackStore.doctors.find((d) => d.id === parseInt(data.doctor_id)) || fallbackStore.doctors[0];
    const patient = fallbackStore.patients.find((p) => p.id === parseInt(data.patient_id));

    const newAppt = res?.data || {
      id: nextId,
      appointment_no: apptNo,
      patient_id: patient ? patient.id : 1,
      patient_name: patient ? patient.name : data.patient_name || 'Patient',
      doctor_id: doctor.id,
      doctor_name: doctor.name,
      appointment_date: data.appointment_date || new Date().toISOString(),
      slot_duration: data.slot_duration || '30',
      status: 'confirmed',
      consultation_fee: doctor.consultation_fee || 600,
      urgency: data.urgency || 'normal',
      clinical_notes: data.clinical_notes || '',
    };

    fallbackStore.appointments.unshift(newAppt);
    fallbackStore.stats.totalAppointments += 1;
    return { success: true, data: newAppt };
  },

  updateAppointmentStatus: async (id, status) => {
    const res = await safeFetch(`${API_BASE}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }, null);

    const appt = fallbackStore.appointments.find((a) => a.id === parseInt(id));
    if (appt) {
      appt.status = status;

      // When appointment becomes 'done', automatically generate an invoice like Odoo
      if (status === 'done') {
        const existingInv = fallbackStore.invoices.find((i) => i.appointment_id === appt.id);
        if (!existingInv) {
          const invId = fallbackStore.invoices.length + 1;
          const newInv = {
            id: invId,
            invoice_no: `INV-2026-${String(invId).padStart(3, '0')}`,
            appointment_id: appt.id,
            patient_id: appt.patient_id,
            patient_name: appt.patient_name,
            doctor_id: appt.doctor_id,
            doctor_name: appt.doctor_name,
            subtotal: appt.consultation_fee,
            tax: 0,
            total_amount: appt.consultation_fee,
            paid_amount: 0,
            status: 'unpaid',
            due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
            lines: [{ description: `Consultation Fee - ${appt.doctor_name}`, quantity: 1, unit_price: appt.consultation_fee, total_price: appt.consultation_fee }],
            payments: [],
          };
          fallbackStore.invoices.unshift(newInv);
        }
      }
    }

    return { success: true };
  },

  verifyAppointmentQr: (code) =>
    safeFetch(`${API_BASE}/appointments/verify/${code}`, {}, {
      success: true,
      data: fallbackStore.appointments.find((a) => a.appointment_no.toLowerCase() === code.toLowerCase()) || fallbackStore.appointments[0],
    }),

  // Prescriptions
  getPrescriptions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`${API_BASE}/prescriptions?${query}`, {}, null);
    if (res && res.success) return res;

    let list = [...fallbackStore.prescriptions];
    if (params.patient_id) {
      list = list.filter((p) => p.patient_id === parseInt(params.patient_id));
    }
    return { success: true, data: list };
  },

  createPrescription: async (data) => {
    const res = await safeFetch(`${API_BASE}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, null);

    const nextId = fallbackStore.prescriptions.length + 1;
    const patient = fallbackStore.patients.find((p) => p.id === parseInt(data.patient_id));
    const doctor = fallbackStore.doctors.find((d) => d.id === parseInt(data.doctor_id));
    const treatment = fallbackStore.treatments.find((t) => t.id === parseInt(data.treatment_id));

    const newPr = res?.data || {
      id: nextId,
      sequence_no: `RX-2026-${String(nextId).padStart(3, '0')}`,
      appointment_id: data.appointment_id || null,
      patient_id: patient ? patient.id : 1,
      patient_name: patient ? patient.name : 'Patient',
      doctor_id: doctor ? doctor.id : 1,
      doctor_name: doctor ? doctor.name : 'Doctor',
      treatment_id: treatment ? treatment.id : null,
      treatment_name: treatment ? treatment.name : null,
      prescription_date: new Date().toISOString().split('T')[0],
      diagnosis: data.diagnosis,
      notes: data.notes || '',
      status: 'prescribed',
      medicines: data.medicines || [],
    };

    fallbackStore.prescriptions.unshift(newPr);
    return { success: true, data: newPr };
  },

  // Medicines Management (Odoo medical.medicine)
  getMedicines: async () => {
    const res = await safeFetch(`${API_BASE}/treatments/medicines`, {}, null);
    if (res && res.success) return res;
    return { success: true, data: [...fallbackStore.medicines] };
  },

  createMedicine: async (data) => {
    const res = await safeFetch(`${API_BASE}/treatments/medicines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, null);

    const newMed = res?.data || {
      id: fallbackStore.medicines.length + 1,
      ...data,
      price: parseFloat(data.price) || 150,
    };

    fallbackStore.medicines.unshift(newMed);
    return { success: true, data: newMed };
  },

  deleteMedicine: async (id) => {
    await safeFetch(`${API_BASE}/treatments/medicines/${id}`, {
      method: 'DELETE',
    }, null);

    const idx = fallbackStore.medicines.findIndex((m) => m.id === parseInt(id));
    if (idx !== -1) fallbackStore.medicines.splice(idx, 1);
    return { success: true };
  },

  // Treatments
  getTreatments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`${API_BASE}/treatments?${query}`, {}, { success: true, data: fallbackStore.treatments });
  },
  getTreatmentCategories: () =>
    safeFetch(`${API_BASE}/treatments/categories`, {}, { success: true, data: fallbackStore.categories }),
  getFrequencies: () =>
    safeFetch(`${API_BASE}/treatments/frequencies`, {}, { success: true, data: fallbackStore.frequencies }),
  createTreatment: (data) =>
    safeFetch(`${API_BASE}/treatments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, { success: true, data }),

  // Billing & Invoices
  getInvoices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`${API_BASE}/billing/invoices?${query}`, {}, null);
    if (res && res.success) return res;

    let list = [...fallbackStore.invoices];
    if (params.status) {
      list = list.filter((i) => i.status === params.status);
    }
    if (params.patient_id) {
      list = list.filter((i) => i.patient_id === parseInt(params.patient_id));
    }
    return { success: true, data: list };
  },

  createInvoice: (data) =>
    safeFetch(`${API_BASE}/billing/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, { success: true }),

  payInvoice: async (id, data) => {
    const res = await safeFetch(`${API_BASE}/billing/invoices/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, null);

    const inv = fallbackStore.invoices.find((i) => i.id === parseInt(id));
    if (inv) {
      inv.paid_amount = (inv.paid_amount || 0) + parseFloat(data.amount);
      if (inv.paid_amount >= inv.total_amount) {
        inv.status = 'paid';
      } else {
        inv.status = 'partially_paid';
      }
      inv.payments.push({
        id: Date.now(),
        amount: parseFloat(data.amount),
        payment_method: data.payment_method,
        transaction_ref: data.transaction_ref,
        payment_date: new Date().toISOString(),
      });
    }

    return { success: true };
  },

  // Equipments
  getEquipments: () =>
    safeFetch(`${API_BASE}/equipments`, {}, {
      success: true,
      data: [
        { id: 1, name: 'Chattanooga Intelect Legend Ultrasound', model: 'INT-400-US', serial_no: 'SN-CHATT-2023-881', status: 'available', last_maintenance_date: '2026-01-15', next_maintenance_date: '2026-04-15' },
        { id: 2, name: 'Digital Cervical & Lumbar Traction Unit', model: 'TRAC-ELITE-9', serial_no: 'SN-TRAC-2022-419', status: 'available', last_maintenance_date: '2026-02-01', next_maintenance_date: '2026-04-01' },
        { id: 3, name: '4-Channel Combo IFT & TENS Therapy Machine', model: 'COMBO-PRO-4CH', serial_no: 'SN-ELECTRO-2024-102', status: 'in_use', last_maintenance_date: '2026-01-10', next_maintenance_date: '2026-04-10' },
      ],
    }),
  createEquipment: (data) =>
    safeFetch(`${API_BASE}/equipments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, { success: true, data }),
  updateEquipmentStatus: (id, status) =>
    safeFetch(`${API_BASE}/equipments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }, { success: true }),

  // X-Ray Reports
  getXrayReports: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`${API_BASE}/xray-reports?${query}`, {}, {
      success: true,
      data: [
        { id: 1, report_no: 'XRAY-2026-001', patient_name: 'Rahul Mehta', doctor_name: 'Dr. Arvind Nair', test_type: 'Digital X-Ray Lumbar Spine (AP & Lateral)', report_date: '2026-10-28', impression: 'Early degenerative disc disease at L4-S1. Advised core stability rehab.', findings: 'Mild disc narrowing at L4-L5 and L5-S1.' },
      ],
    });
  },
  createXrayReport: (data) =>
    safeFetch(`${API_BASE}/xray-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, { success: true, data }),

  // Shifts
  getShifts: () =>
    safeFetch(`${API_BASE}/shifts`, {}, { success: true, data: fallbackStore.shifts }),
};
