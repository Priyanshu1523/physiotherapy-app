const express = require('express');
const router = express.Router();
const { memoryStore, query, isPgConnected } = require('../db');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const totalPatients = memoryStore.patients.length;
    const totalAppointments = memoryStore.appointments.length;
    const todayStr = new Date().toISOString().split('T')[0];

    const todayAppointments = memoryStore.appointments.filter((a) =>
      a.appointment_date && a.appointment_date.startsWith(todayStr)
    ).length;

    const confirmedCount = memoryStore.appointments.filter((a) => a.status === 'confirmed').length;
    const inProgressCount = memoryStore.appointments.filter((a) => a.status === 'in_progress').length;
    const completedCount = memoryStore.appointments.filter((a) => a.status === 'done').length;

    const totalRevenue = memoryStore.invoices.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0);
    const pendingAmount = memoryStore.invoices
      .filter((inv) => inv.status !== 'paid')
      .reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.paid_amount)), 0);

    const availableEquipments = memoryStore.equipments.filter((e) => e.status === 'available').length;
    const totalEquipments = memoryStore.equipments.length;

    // Recent 5 appointments
    const recentAppointments = [...memoryStore.appointments]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalPatients,
        totalAppointments,
        todayAppointments,
        confirmedCount,
        inProgressCount,
        completedCount,
        totalRevenue,
        pendingAmount,
        availableEquipments,
        totalEquipments,
        recentAppointments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
