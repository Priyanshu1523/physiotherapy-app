require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const doctorsRoutes = require('./routes/doctors');
const patientsRoutes = require('./routes/patients');
const appointmentsRoutes = require('./routes/appointments');
const prescriptionsRoutes = require('./routes/prescriptions');
const treatmentsRoutes = require('./routes/treatments');
const billingRoutes = require('./routes/billing');
const equipmentsRoutes = require('./routes/equipments');
const xrayReportsRoutes = require('./routes/xrayReports');
const shiftsRoutes = require('./routes/shifts');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Physiotherapy Management System API (Node.js + PostgreSQL)',
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/treatments', treatmentsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/equipments', equipmentsRoutes);
app.use('/api/xray-reports', xrayReportsRoutes);
app.use('/api/shifts', shiftsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[API Error]', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🩺 Physiotherapy Backend Server Running on http://localhost:${PORT}`);
  console.log(`📡 API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`================================================================`);
});

module.exports = app;
