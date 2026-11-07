import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  Shield,
  Stethoscope,
  PhoneCall,
  User,
  CheckCircle2,
  XCircle,
  KeyRound,
  Filter,
} from 'lucide-react';

export default function UsersRolesView() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showMatrix, setShowMatrix] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'doctor',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.updateUserRole(userId, newRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      alert('Failed to update role: ' + err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createUser(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        setFormData({ name: '', email: '', password: '', phone: '', role: 'doctor' });
        loadUsers();
      }
    } catch (err) {
      alert('Failed to create user: ' + err.message);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return {
          bg: '#fee2e2',
          color: '#b91c1c',
          border: '#fca5a5',
          label: '👑 Administrator',
          desc: 'Full ERP & Clinic Access',
        };
      case 'doctor':
        return {
          bg: '#e0f2fe',
          color: '#0369a1',
          border: '#7dd3fc',
          label: '🩺 Doctor / Therapist',
          desc: 'Clinical Prescriptions & Sessions',
        };
      case 'receptionist':
        return {
          bg: '#fef3c7',
          color: '#b45309',
          border: '#fcd34d',
          label: '📋 Reception Desk',
          desc: 'Appointments, Check-ins & Billing',
        };
      case 'patient':
        return {
          bg: '#dcfce7',
          color: '#15803d',
          border: '#86efac',
          label: '👤 Patient Portal',
          desc: 'Self-Service Booking & Records',
        };
      default:
        return {
          bg: '#f1f5f9',
          color: '#475569',
          border: '#cbd5e1',
          label: role,
          desc: 'General User',
        };
    }
  };

  const filteredUsers = filterRole === 'all'
    ? users
    : users.filter((u) => u.role === filterRole);

  const roleCounts = {
    all: users.length,
    admin: users.filter((u) => u.role === 'admin').length,
    doctor: users.filter((u) => u.role === 'doctor').length,
    receptionist: users.filter((u) => u.role === 'receptionist').length,
    patient: users.filter((u) => u.role === 'patient').length,
  };

  const permissionsMatrix = [
    { module: 'Clinical Dashboard & Overview KPIs', admin: true, doctor: true, receptionist: true, patient: false },
    { module: 'Doctor Working Shifts & Calendars', admin: true, doctor: true, receptionist: true, patient: false },
    { module: 'Book & Reschedule Appointments', admin: true, doctor: true, receptionist: true, patient: true },
    { module: 'Reception QR Verification & Check-in', admin: true, doctor: false, receptionist: true, patient: false },
    { module: 'Patient Medical History & Directory', admin: true, doctor: true, receptionist: true, patient: false },
    { module: 'Write Medical Prescriptions (Rx)', admin: true, doctor: true, receptionist: false, patient: false },
    { module: 'Treatment Modalities Catalog & Rates', admin: true, doctor: true, receptionist: true, patient: false },
    { module: 'Billing & Invoicing (Fee Collection)', admin: true, doctor: false, receptionist: true, patient: false },
    { module: 'Clinic Equipments & Maintenance', admin: true, doctor: false, receptionist: true, patient: false },
    { module: 'Diagnostic X-Ray Scans & Reports', admin: true, doctor: true, receptionist: false, patient: false },
    { module: 'Personal Medical Records & Slips', admin: true, doctor: true, receptionist: false, patient: true },
    { module: 'User Accounts & Security Roles (RBAC)', admin: true, doctor: false, receptionist: false, patient: false },
  ];

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={26} color="#0284c7" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              User Accounts & Security Roles (RBAC)
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
            Strict Role-Based Access Control ported from Odoo 19 Security Groups (<code>group_physio_admin</code>, <code>group_physio_doctor</code>, <code>group_physio_receptionist</code>, <code>group_physio_patient</code>)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className="btn btn-outline"
            style={{ fontSize: '0.85rem' }}
          >
            <Shield size={16} /> {showMatrix ? 'Hide' : 'Show'} Permissions Matrix
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <UserPlus size={16} /> Add Staff User
          </button>
        </div>
      </div>

      {/* Role Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>TOTAL ACCOUNTS</span>
            <Users size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {roleCounts.all}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>System-wide registered users</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #fee2e2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b91c1c' }}>ADMINISTRATORS</span>
            <ShieldCheck size={20} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b91c1c', marginTop: '0.5rem' }}>
            {roleCounts.admin}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Full clinic & ERP access</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e0f2fe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1' }}>DOCTORS / THERAPISTS</span>
            <Stethoscope size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0369a1', marginTop: '0.5rem' }}>
            {roleCounts.doctor}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Clinical Rx & Consultations</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #fef3c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309' }}>RECEPTION DESK</span>
            <PhoneCall size={20} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b45309', marginTop: '0.5rem' }}>
            {roleCounts.receptionist}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Appointments, QR & Invoices</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #dcfce7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>PORTAL PATIENTS</span>
            <User size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#15803d', marginTop: '0.5rem' }}>
            {roleCounts.patient}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Enrolled patient portal users</span>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {[
          { id: 'all', label: `All Users (${roleCounts.all})` },
          { id: 'admin', label: `👑 Admins (${roleCounts.admin})` },
          { id: 'doctor', label: `🩺 Doctors (${roleCounts.doctor})` },
          { id: 'receptionist', label: `📋 Receptionists (${roleCounts.receptionist})` },
          { id: 'patient', label: `👤 Patients (${roleCounts.patient})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterRole(t.id)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: filterRole === t.id ? '#0284c7' : '#f1f5f9',
              color: filterRole === t.id ? '#ffffff' : '#475569',
              fontWeight: filterRole === t.id ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '0.85rem 1rem' }}>User / Account</th>
              <th style={{ padding: '0.85rem 1rem' }}>Contact Info</th>
              <th style={{ padding: '0.85rem 1rem' }}>Active Role</th>
              <th style={{ padding: '0.85rem 1rem' }}>Associated Entity</th>
              <th style={{ padding: '0.85rem 1rem' }}>Change Role (RBAC)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Loading user accounts...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  No users found in this role category.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const badge = getRoleBadge(u.role);
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                        }}>
                          {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID #{u.id}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ color: '#0f172a' }}>{u.email}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.phone || 'No phone'}</div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}>
                        {badge.label}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                        {badge.desc}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {u.patient_code && (
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          Patient Code: {u.patient_code}
                        </span>
                      )}
                      {u.doctor_specialization && (
                        <span style={{ backgroundColor: '#e0f2fe', color: '#0284c7', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          Specialist: {u.doctor_specialization}
                        </span>
                      )}
                      {!u.patient_code && !u.doctor_specialization && (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Clinic Staff Account</span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        style={{
                          padding: '0.35rem 0.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="admin">👑 Administrator</option>
                        <option value="doctor">🩺 Doctor / Therapist</option>
                        <option value="receptionist">📋 Reception Desk</option>
                        <option value="patient">👤 Patient Portal</option>
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Permissions Matrix (Odoo Security Groups Comparison) */}
      {showMatrix && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="#0284c7" />
              Role Permissions & Access Matrix (Odoo 19 Security Architecture)
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Defines what each security group is permitted to view, execute, or manage across the clinical ERP:
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem' }}>ERP Module / Clinical Function</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#b91c1c' }}>👑 Administrator</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#0369a1' }}>🩺 Doctor</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#b45309' }}>📋 Receptionist</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#15803d' }}>👤 Patient Portal</th>
              </tr>
            </thead>
            <tbody>
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600, color: '#334155' }}>
                    {item.module}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {item.admin ? <CheckCircle2 size={16} color="#16a34a" style={{ margin: '0 auto' }} /> : <XCircle size={16} color="#ef4444" style={{ margin: '0 auto' }} />}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {item.doctor ? <CheckCircle2 size={16} color="#16a34a" style={{ margin: '0 auto' }} /> : <XCircle size={16} color="#ef4444" style={{ margin: '0 auto' }} />}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {item.receptionist ? <CheckCircle2 size={16} color="#16a34a" style={{ margin: '0 auto' }} /> : <XCircle size={16} color="#ef4444" style={{ margin: '0 auto' }} />}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {item.patient ? <CheckCircle2 size={16} color="#16a34a" style={{ margin: '0 auto' }} /> : <XCircle size={16} color="#ef4444" style={{ margin: '0 auto' }} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Staff User Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', width: '100%', maxWidth: '480px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Add New Staff Member</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Verma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="rajesh.verma@physioclinic.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Security Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontWeight: 600 }}
                >
                  <option value="doctor">🩺 Doctor / Physiotherapist (Clinical care & Prescriptions)</option>
                  <option value="receptionist">📋 Reception Desk (Front Office, QR Check-in & Billing)</option>
                  <option value="admin">👑 Administrator (Full Clinic Control)</option>
                  <option value="patient">👤 Patient (Self-Service Portal)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
