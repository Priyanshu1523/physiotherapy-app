import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  IndianRupee,
  Activity,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  UserPlus,
  FileText,
  Pill,
  Receipt,
  Play,
  Check,
  AlertCircle,
  Wrench,
  Stethoscope,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function DashboardView({ setActiveTab, currentUser }) {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, apptsRes, docsRes, eqRes] = await Promise.all([
        api.getDashboardStats(),
        api.getAppointments(),
        api.getDoctors(),
        api.getEquipments(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (apptsRes.success) setAppointments(apptsRes.data);
      if (docsRes.success) setDoctors(docsRes.data);
      if (eqRes.success) setEquipments(eqRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (apptId, newStatus) => {
    try {
      await api.updateAppointmentStatus(apptId, newStatus);
      loadDashboard();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  if (loading || !stats) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        Loading clinic operational analytics & queue...
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Registered Patients',
      value: stats.totalPatients,
      icon: Users,
      bg: '#e0f2fe',
      color: '#0284c7',
      tab: 'patients',
      sub: 'Enrolled in clinical records',
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: Calendar,
      bg: '#fef3c7',
      color: '#d97706',
      tab: 'appointments',
      sub: 'Scheduled across all shifts',
    },
    {
      title: 'Active Consultations',
      value: stats.inProgressCount,
      icon: Clock,
      bg: '#ede9fe',
      color: '#7c3aed',
      tab: 'appointments',
      sub: 'Currently in therapy suite',
    },
    {
      title: 'Completed Sessions',
      value: stats.completedCount,
      icon: CheckCircle2,
      bg: '#dcfce7',
      color: '#16a34a',
      tab: 'appointments',
      sub: 'Treatment delivered & verified',
    },
    {
      title: 'Total Revenue Collected',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      bg: '#ccfbf1',
      color: '#0d9488',
      tab: 'billing',
      sub: 'Collected via UPI/Cash/Card',
    },
    {
      title: 'Pending Receivables',
      value: `₹${stats.pendingAmount.toLocaleString()}`,
      icon: TrendingUp,
      bg: '#fee2e2',
      color: '#dc2626',
      tab: 'billing',
      sub: 'Unpaid consultation fees',
    },
  ];

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner & Date Info */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              Clinic Operations & Command Hub
            </h2>
            <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
              Live Odoo Sync
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
            Real-time patient queue, shift allocations, doctor consultations, and instant invoicing.
          </p>
        </div>

        {/* Action Bar */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => setActiveTab('appointments')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
          >
            <PlusCircle size={15} /> Book Appointment
          </button>
          <button
            className="btn btn-outline"
            onClick={() => setActiveTab('patients')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
          >
            <UserPlus size={15} /> Add Patient
          </button>
          <button
            className="btn btn-outline"
            onClick={() => setActiveTab('prescriptions')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
          >
            <FileText size={15} /> Write Rx
          </button>
          <button
            className="btn btn-outline"
            onClick={() => setActiveTab('medicines')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
          >
            <Pill size={15} /> Medicines
          </button>
          <button
            className="btn btn-outline"
            onClick={() => setActiveTab('billing')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
          >
            <Receipt size={15} /> Invoicing
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
      }}>
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div
              key={i}
              onClick={() => setActiveTab(k.tab)}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.85rem',
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = k.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>{k.title}</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={k.color} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0.5rem 0 0.2rem' }}>
                {k.value}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{k.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Main Operations Split: Patient Queue + Doctor Shift / Equipment Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Today's Clinical Appointment Queue & Action Desk */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                Today's Patient Queue & Clinical Desk
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                Directly transition appointment status (Odoo workflow: Confirmed ➔ In Progress ➔ Done)
              </p>
            </div>
            <button
              onClick={() => setActiveTab('appointments')}
              style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View All ({appointments.length}) &rarr;
            </button>
          </div>

          <table className="clinic-table">
            <thead>
              <tr>
                <th>Appt No.</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Workflow Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.slice(0, 6).map((appt) => (
                <tr key={appt.id}>
                  <td>
                    <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.85rem' }}>{appt.appointment_no}</span>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{appt.patient_name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{appt.clinical_notes || 'Consultation'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>{appt.doctor_name}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${appt.status}`}>
                      {appt.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                      {appt.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'in_progress')}
                          className="btn btn-primary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Play size={12} /> Start Session
                        </button>
                      )}
                      {appt.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'done')}
                          className="btn btn-primary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', backgroundColor: '#16a34a', borderColor: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Check size={12} /> Mark Done
                        </button>
                      )}
                      {appt.status === 'done' && (
                        <button
                          onClick={() => setActiveTab('prescriptions')}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <FileText size={12} /> Issue Rx
                        </button>
                      )}
                      {appt.status === 'draft' && (
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}
                        >
                          Confirm
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Side Panels: Doctor Duty & Equipment Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Doctor Shift Schedule */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Stethoscope size={18} color="#0284c7" /> Doctor Timetables & Shifts
              </h4>
              <button
                onClick={() => setActiveTab('doctors')}
                style={{ fontSize: '0.75rem', color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                Manage Staff &rarr;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {doctors.map((doc) => (
                <div key={doc.id} style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{doc.name}</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7' }}>₹{doc.consultation_fee}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#0f766e', fontWeight: 600 }}>{doc.specialization_name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', fontSize: '0.72rem', color: '#64748b' }}>
                    <span>Reg: {doc.registration_no}</span>
                    <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      Morning & Afternoon
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Equipment Readiness Panel */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Wrench size={18} color="#0f766e" /> Clinic Equipment Readiness
              </h4>
              <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.8rem' }}>
                {stats.availableEquipments} / {stats.totalEquipments} Ready
              </span>
            </div>

            <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{
                width: `${(stats.availableEquipments / (stats.totalEquipments || 1)) * 100}%`,
                height: '100%',
                backgroundColor: '#10b981',
              }}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {equipments.slice(0, 3).map((eq) => (
                <div key={eq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#334155', fontWeight: 600 }}>{eq.name}</div>
                  <span className={`badge badge-${eq.status === 'available' ? 'done' : eq.status === 'in_use' ? 'in_progress' : 'draft'}`}>
                    {eq.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('equipments')}
              className="btn btn-outline"
              style={{ width: '100%', marginTop: '0.85rem', fontSize: '0.8rem', padding: '0.45rem' }}
            >
              Manage Assets & Calibration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
