import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCheck,
  FileText,
  Activity,
  Receipt,
  Wrench,
  FileSearch,
  Globe,
  ArrowLeft,
  ShieldCheck,
  Stethoscope,
  PhoneCall,
  User,
  LogOut,
  HeartPulse,
  Pill,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  onBackToWebsite,
  currentUser,
  onLogout,
}) {
  const role = currentUser?.role || 'admin';

  // Role Badges and metadata matching Odoo Security Groups
  const roleMeta = {
    admin: {
      label: 'Administrator',
      icon: ShieldCheck,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
      badge: '👑 Admin (Full Access)',
    },
    doctor: {
      label: 'Doctor / Therapist',
      icon: Stethoscope,
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.15)',
      badge: '🩺 Clinical Specialist',
    },
    receptionist: {
      label: 'Reception Desk',
      icon: PhoneCall,
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.15)',
      badge: '📋 Front Office Desk',
    },
    patient: {
      label: 'Patient Portal',
      icon: HeartPulse,
      color: '#4ade80',
      bg: 'rgba(74, 222, 128, 0.15)',
      badge: '👤 Patient Self-Service',
    },
  };

  const currentMeta = roleMeta[role] || roleMeta.admin;

  // Role-Based Access Control: Define strictly permitted modules per role
  const allModules = [
    {
      id: 'dashboard',
      label: role === 'doctor' ? 'Clinical Desk' : role === 'receptionist' ? 'Reception Overview' : 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'doctor', 'receptionist'],
    },
    {
      id: 'appointments',
      label: role === 'doctor' ? 'My Appointments' : role === 'receptionist' ? 'Appointments & Check-in' : 'Appointments',
      icon: CalendarDays,
      roles: ['admin', 'doctor', 'receptionist'],
    },
    {
      id: 'patients',
      label: role === 'doctor' ? 'Patient Medical Records' : role === 'receptionist' ? 'Patient Directory & Intake' : 'Patients',
      icon: Users,
      roles: ['admin', 'doctor', 'receptionist'],
    },
    {
      id: 'my_portal',
      label: 'My Health Portal',
      icon: HeartPulse,
      roles: ['patient'],
    },
    {
      id: 'prescriptions',
      label: 'Prescriptions (Rx)',
      icon: FileText,
      roles: ['admin', 'doctor'],
    },
    {
      id: 'medicines',
      label: 'Medicines Catalog',
      icon: Pill,
      roles: ['admin', 'doctor'],
    },
    {
      id: 'treatments',
      label: 'Treatments & Rates',
      icon: Activity,
      roles: ['admin', 'doctor'],
    },
    {
      id: 'billing',
      label: 'Billing & Invoices',
      icon: Receipt,
      roles: ['admin', 'receptionist'],
    },
    {
      id: 'equipments',
      label: 'Clinic Equipment',
      icon: Wrench,
      roles: ['admin', 'receptionist'],
    },
    {
      id: 'xray',
      label: 'X-Ray & Reports',
      icon: FileSearch,
      roles: ['admin', 'doctor'],
    },
    {
      id: 'doctors',
      label: 'Doctors & Staff',
      icon: UserCheck,
      roles: ['admin'],
    },
    {
      id: 'roles',
      label: 'Users & Roles (RBAC)',
      icon: ShieldCheck,
      roles: ['admin'],
    },
    {
      id: 'portal',
      label: role === 'patient' ? 'Book New Appointment' : 'Online Booking View',
      icon: Globe,
      roles: ['admin', 'receptionist', 'patient'],
    },
  ];

  // Filter modules based on active user's role
  const permittedModules = allModules.filter((m) => m.roles.includes(role));

  return (
    <aside style={{ width: '265px', backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
      {/* Brand & Back to Website */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid #1e293b' }}>
        <button
          onClick={onBackToWebsite}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: '#1e293b',
            color: '#38bdf8',
            border: 'none',
            padding: '0.4rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '0.75rem',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={14} /> Back to Public Website
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
            PC
          </div>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>PhysioCare ERP</h1>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Clinic Management System</p>
          </div>
        </div>

        {/* Current Active Role Indicator */}
        <div style={{
          marginTop: '0.85rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          backgroundColor: currentMeta.bg,
          border: `1px solid ${currentMeta.color}40`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <currentMeta.icon size={16} color={currentMeta.color} />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: currentMeta.color }}>
              {currentMeta.badge}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#cbd5e1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentUser?.name || 'User'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.75rem 0.5rem' }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
            {role === 'patient' ? 'Patient Portal' : 'Allowed ERP Modules'}
          </p>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8', backgroundColor: '#1e293b', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
            {permittedModules.length} Active
          </span>
        </div>

        <ul style={{ listStyle: 'none' }}>
          {permittedModules.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id} style={{ marginBottom: '0.25rem' }}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    backgroundColor: isActive ? '#0284c7' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#1e293b';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon size={18} color={isActive ? '#ffffff' : '#94a3b8'} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Session & Logout */}
      <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #1e293b', backgroundColor: '#090d16' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0 }}></span>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.name || 'Administrator'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.email || 'admin@physioclinic.com'}
              </div>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                padding: '0.3rem',
                borderRadius: '4px',
              }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
        <p style={{ fontSize: '0.68rem', color: '#475569' }}>Odoo 19 Healthcare Port • PostgreSQL</p>
      </div>
    </aside>
  );
}
