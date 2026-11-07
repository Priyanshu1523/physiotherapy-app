import React, { useState } from 'react';
import { User, Globe, LogOut, ShieldCheck, LogIn, UserPlus } from 'lucide-react';

export default function Header({
  activeTab,
  currentUser,
  onBackToWebsite,
  onOpenAuthModal,
  onLogout,
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  const titles = {
    dashboard: currentUser?.role === 'doctor' ? 'Clinical Desk & Consultation Queue' : currentUser?.role === 'receptionist' ? 'Reception Desk & Patient Flow' : 'Clinic Overview & Dashboard',
    appointments: currentUser?.role === 'doctor' ? 'My Assigned Appointments & Sessions' : currentUser?.role === 'receptionist' ? 'Front Desk Appointments & QR Verification' : 'Appointment Scheduling & Management',
    patients: currentUser?.role === 'doctor' ? 'Patient Medical Charts & History' : 'Patient Medical Records & Directory',
    doctors: 'Physiotherapists & Staff Directory',
    prescriptions: 'Medical Prescriptions & Clinical Notes (Rx)',
    medicines: 'Medicines & Clinical Pharmacy Catalog',
    treatments: 'Treatment Modalities & Price Catalog',
    billing: 'Invoicing & Fee Collection (Reception Desk)',
    equipments: 'Clinic Equipment & Asset Maintenance',
    xray: 'Diagnostic Imaging & X-Ray Reports',
    portal: currentUser?.role === 'patient' ? 'Book a Therapy Session' : 'Online Booking Portal View',
    roles: 'User Accounts & Security Roles (RBAC)',
    my_portal: 'Patient Self-Service Health Portal',
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'Admin' };
      case 'doctor':
        return { bg: '#e0f2fe', color: '#0369a1', label: 'Doctor' };
      case 'receptionist':
        return { bg: '#fef3c7', color: '#b45309', label: 'Reception Desk' };
      case 'patient':
        return { bg: '#dcfce7', color: '#15803d', label: 'Patient' };
      default:
        return { bg: '#f1f5f9', color: '#475569', label: role || 'Staff' };
    }
  };

  const badge = getRoleBadgeColor(currentUser?.role);

  return (
    <header style={{
      height: '64px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      flexShrink: 0,
      position: 'relative',
      zIndex: 30,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
          {titles[activeTab] || 'Physiotherapy Management'}
        </h2>
        <button
          onClick={onBackToWebsite}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '0.3rem 0.65rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#0284c7',
            cursor: 'pointer',
          }}
        >
          <Globe size={13} /> Visit Public Website
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {currentUser ? (
          /* LOGGED IN USER PROFILE */
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                padding: '0.35rem 0.65rem',
                borderRadius: '0.5rem',
                backgroundColor: showDropdown ? '#f1f5f9' : 'transparent',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7',
                fontWeight: 800,
                fontSize: '0.9rem',
              }}>
                {currentUser.name ? currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : 'U'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    {currentUser.name}
                  </span>
                  <span style={{
                    backgroundColor: badge.bg,
                    color: badge.color,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                  }}>
                    {badge.label}
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {currentUser.patient_code ? `Patient ID: ${currentUser.patient_code}` : currentUser.email}
                </span>
              </div>
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '220px',
                backgroundColor: '#ffffff',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                padding: '0.5rem',
                zIndex: 50,
              }}>
                <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#64748b' }}>
                  Signed in as<br />
                  <strong style={{ color: '#0f172a' }}>{currentUser.email}</strong>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ backgroundColor: badge.bg, color: badge.color, padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.7rem' }}>
                      Role: {badge.label}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onOpenAuthModal('login');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#0284c7',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogIn size={14} /> Switch / Log In Different Role
                </button>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onLogout();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#dc2626',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '0.25rem',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          /* NOT LOGGED IN BUTTONS */
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onOpenAuthModal('login')}
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            >
              <LogIn size={14} /> Sign In
            </button>
            <button
              onClick={() => onOpenAuthModal('register')}
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            >
              <UserPlus size={14} /> Register as Patient
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
