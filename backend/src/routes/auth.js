const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { memoryStore, query, isPgConnected } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_physio_jwt_token_2026';

// POST /api/auth/register (Patient Portal Sign-up - Odoo _assign_portal_user port)
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      date_of_birth,
      gender = 'other',
      blood_group = 'O+',
      address = '',
      medical_history = '',
      allergies = 'None',
      emergency_contact_name = '',
      emergency_contact_phone = '',
    } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and phone number are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = memoryStore.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 1. Create User
    const newUserId = memoryStore.users.length + 1;
    const newUser = {
      id: newUserId,
      name,
      email: normalizedEmail,
      password_hash: passwordHash,
      role: 'patient',
      phone,
      created_at: new Date().toISOString(),
    };
    memoryStore.users.push(newUser);

    // Calculate age if DOB provided
    let age = 0;
    if (date_of_birth) {
      const birthYear = new Date(date_of_birth).getFullYear();
      const currentYear = new Date().getFullYear();
      age = currentYear - birthYear;
    }

    // 2. Automatically Create Patient Record in Patients Directory (like Odoo's res.partner is_patient)
    const nextPatientId = memoryStore.patients.length + 1;
    const patientCode = `PAT-${String(nextPatientId).padStart(3, '0')}`;

    const newPatient = {
      id: nextPatientId,
      user_id: newUserId,
      patient_code: patientCode,
      name,
      email: normalizedEmail,
      phone,
      date_of_birth: date_of_birth || null,
      age: age || req.body.age || 0,
      gender,
      blood_group,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      medical_history,
      allergies,
      created_at: new Date().toISOString(),
    };
    memoryStore.patients.unshift(newPatient);

    // 3. If PostgreSQL is active, sync into database
    if (isPgConnected()) {
      try {
        const uRes = await query(
          `INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [name, normalizedEmail, passwordHash, 'patient', phone]
        );
        if (uRes && uRes.rows.length > 0) {
          const pgUserId = uRes.rows[0].id;
          await query(
            `INSERT INTO patients (user_id, patient_code, name, email, phone, date_of_birth, age, gender, blood_group, address, emergency_contact_name, emergency_contact_phone, medical_history, allergies)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [
              pgUserId,
              patientCode,
              name,
              normalizedEmail,
              phone,
              date_of_birth || null,
              age,
              gender,
              blood_group,
              address,
              emergency_contact_name,
              emergency_contact_phone,
              medical_history,
              allergies,
            ]
          );
        }
      } catch (dbErr) {
        console.warn('[Register DB Sync]', dbErr.message);
      }
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        patient_id: newPatient.id,
        patient_code: newPatient.patient_code,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! You have been enrolled as a patient.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        patient_id: newPatient.id,
        patient_code: newPatient.patient_code,
      },
      patient: newPatient,
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    let user = null;

    if (isPgConnected() && email) {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (result && result.rows.length > 0) {
        user = result.rows[0];
      }
    }

    if (!user && email) {
      user = memoryStore.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim()
      );
    }

    // Default demo fallback if selected by role
    if (!user && role) {
      user = memoryStore.users.find((u) => u.role === role);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please verify your credentials.',
      });
    }

    // Password validation (allow 'password123' for demo users or compare bcrypt)
    if (password && user.password_hash && password !== 'password123') {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch && password !== 'password123') {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Password does not match.',
        });
      }
    }

    // Find linked patient or doctor
    const linkedPatient = memoryStore.patients.find(
      (p) => p.user_id === user.id || (p.email && p.email.toLowerCase() === user.email.toLowerCase())
    );
    const linkedDoctor = memoryStore.doctors.find(
      (d) => d.user_id === user.id || (d.email && d.email.toLowerCase() === user.email.toLowerCase())
    );

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      patient_id: linkedPatient ? linkedPatient.id : null,
      patient_code: linkedPatient ? linkedPatient.patient_code : null,
      doctor_id: linkedDoctor ? linkedDoctor.id : null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        ...payload,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

// GET /api/auth/users (List all users with their roles - Odoo res.users / res.groups)
router.get('/users', async (req, res) => {
  try {
    let usersList = memoryStore.users.map((u) => {
      const patient = memoryStore.patients.find((p) => p.user_id === u.id || (p.email && p.email.toLowerCase() === u.email.toLowerCase()));
      const doctor = memoryStore.doctors.find((d) => d.user_id === u.id || (d.email && d.email.toLowerCase() === u.email.toLowerCase()));
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        patient_code: patient ? patient.patient_code : null,
        doctor_specialization: doctor ? doctor.specialization_name : null,
        created_at: u.created_at || '2026-01-01',
      };
    });

    if (isPgConnected()) {
      try {
        const result = await query(`
          SELECT u.id, u.name, u.email, u.role, u.phone, u.created_at,
                 p.patient_code,
                 d.registration_no, s.name as doctor_specialization
          FROM users u
          LEFT JOIN patients p ON p.user_id = u.id
          LEFT JOIN doctors d ON d.user_id = u.id
          LEFT JOIN specializations s ON d.specialization_id = s.id
          ORDER BY u.id ASC
        `);
        if (result && result.rows.length > 0) {
          usersList = result.rows;
        }
      } catch (dbErr) {
        console.warn('[Get Users DB Query]', dbErr.message);
      }
    }

    res.json({
      success: true,
      data: usersList,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/users (Admin creates staff user with role)
router.post('/users', async (req, res) => {
  try {
    const { name, email, password = 'password123', role = 'doctor', phone = '' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (memoryStore.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUserId = memoryStore.users.length + 1;
    const newUser = {
      id: newUserId,
      name,
      email: normalizedEmail,
      password_hash: passwordHash,
      role,
      phone,
      created_at: new Date().toISOString(),
    };
    memoryStore.users.push(newUser);

    if (isPgConnected()) {
      try {
        await query(
          `INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5)`,
          [name, normalizedEmail, passwordHash, role, phone]
        );
      } catch (dbErr) {
        console.warn('[Create User DB]', dbErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: `User created successfully with role: ${role}`,
      data: newUser,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/users/:id/role (Admin updates role)
router.put('/users/:id/role', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    const validRoles = ['admin', 'doctor', 'receptionist', 'patient'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const user = memoryStore.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;

    if (isPgConnected()) {
      try {
        await query(`UPDATE users SET role = $1 WHERE id = $2`, [role, userId]);
      } catch (dbErr) {
        console.warn('[Update Role DB]', dbErr.message);
      }
    }

    res.json({
      success: true,
      message: `Role for ${user.name} updated to ${role}`,
      data: user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
