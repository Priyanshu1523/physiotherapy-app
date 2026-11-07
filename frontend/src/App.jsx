import React, { useState, useEffect } from 'react';
import WebsiteView from './views/WebsiteView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import DashboardView from './views/DashboardView';
import AppointmentsView from './views/AppointmentsView';
import PatientsView from './views/PatientsView';
import DoctorsView from './views/DoctorsView';
import PrescriptionsView from './views/PrescriptionsView';
import MedicinesView from './views/MedicinesView';
import TreatmentsView from './views/TreatmentsView';
import BillingView from './views/BillingView';
import EquipmentsView from './views/EquipmentsView';
import XrayReportsView from './views/XrayReportsView';
import PortalBookingView from './views/PortalBookingView';
import PatientPortalView from './views/PatientPortalView';
import UsersRolesView from './views/UsersRolesView';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';

export default function App() {
  // 'website' (Public Clinic Website) or 'portal' (Staff/Patient ERP Management Portal)
  const [viewMode, setViewMode] = useState('website');

  // Authentication State: Null by default if user is not logged in!
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('physio_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null; // Guest user by default
  });

  const [activeTab, setActiveTab] = useState(() => {
    return currentUser?.role === 'patient' ? 'my_portal' : 'dashboard';
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

  // Adjust activeTab when currentUser changes
  useEffect(() => {
    if (currentUser?.role === 'patient') {
      if (activeTab !== 'portal' && activeTab !== 'my_portal') {
        setActiveTab('my_portal');
      }
    } else if (currentUser) {
      if (activeTab === 'my_portal') {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser]);

  const handleOpenAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    if (token) localStorage.setItem('physio_token', token);
    localStorage.setItem('physio_user', JSON.stringify(user));

    if (user.role === 'patient') {
      setActiveTab('my_portal');
    } else {
      setActiveTab('dashboard');
    }
    setViewMode('portal');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('physio_token');
    localStorage.removeItem('physio_user');
    setViewMode('website');
  };

  // Secure Entry to ERP: If user is not logged in, they CANNOT enter the ERP!
  const handleEnterPortal = () => {
    if (!currentUser) {
      alert('🔒 Authentication Required: Please sign in with your Staff or Patient account to access the Clinic ERP Management Portal.');
      handleOpenAuthModal('login');
      return;
    }
    setViewMode('portal');
  };

  // If in public website mode, show the full clinic website
  if (viewMode === 'website') {
    return (
      <>
        <WebsiteView
          onEnterPortal={handleEnterPortal}
          currentUser={currentUser}
          onOpenAuthModal={handleOpenAuthModal}
          onLogout={handleLogout}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          initialTab={authModalTab}
        />
      </>
    );
  }

  // Security Wall: If user tries to access ERP without being logged in, force return to website and open login modal
  if (!currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        padding: '2rem',
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1.25rem',
          padding: '2.5rem',
          maxWidth: '440px',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Staff & Patient Authentication Required
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.75rem' }}>
            You must be signed in to access the PhysioCare Clinical ERP Management Portal.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => handleOpenAuthModal('login')}
              className="btn btn-primary"
              style={{ padding: '0.75rem', fontSize: '0.95rem' }}
            >
              <LogIn size={16} /> Sign In to ERP Account
            </button>
            <button
              onClick={() => setViewMode('website')}
              className="btn btn-outline"
              style={{ padding: '0.7rem', fontSize: '0.9rem' }}
            >
              <ArrowLeft size={16} /> Return to Public Website
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          initialTab={authModalTab}
        />
      </div>
    );
  }

  // Role Permissions Checking
  const checkPermission = (tab) => {
    const role = currentUser?.role || 'admin';
    if (role === 'admin') return true;

    if (role === 'patient') {
      return tab === 'my_portal' || tab === 'portal';
    }

    if (role === 'doctor') {
      const doctorAllowed = ['dashboard', 'appointments', 'patients', 'prescriptions', 'medicines', 'treatments', 'xray'];
      return doctorAllowed.includes(tab);
    }

    if (role === 'receptionist') {
      const receptionistAllowed = ['dashboard', 'appointments', 'patients', 'billing', 'equipments', 'portal'];
      return receptionistAllowed.includes(tab);
    }

    return false;
  };

  // Render Access Denied banner if user attempts to access a restricted module
  const renderAccessDenied = () => (
    <div style={{ padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '500px', margin: '4rem auto', backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #fee2e2', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
        <ShieldAlert size={32} color="#dc2626" />
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Access Restricted (RBAC)</h3>
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.5 }}>
        Your current role (<strong>{currentUser?.role?.toUpperCase()}</strong>) does not have permission to view or manage this module under Odoo 19 security rules.
      </p>
      <button
        onClick={() => setActiveTab(currentUser?.role === 'patient' ? 'my_portal' : 'dashboard')}
        className="btn btn-primary"
        style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <ArrowLeft size={16} /> Return to Permitted Dashboard
      </button>
    </div>
  );

  // Clinical ERP Portal Router
  const renderActiveView = () => {
    // 1. Patient Portal Routing
    if (currentUser?.role === 'patient') {
      if (activeTab === 'portal') {
        return <PortalBookingView setActiveTab={setActiveTab} currentUser={currentUser} />;
      }
      return <PatientPortalView currentUser={currentUser} setActiveTab={setActiveTab} />;
    }

    // 2. Permission Guard
    if (!checkPermission(activeTab)) {
      return renderAccessDenied();
    }

    // 3. Permitted Views
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView setActiveTab={setActiveTab} currentUser={currentUser} />;
      case 'appointments':
        return <AppointmentsView currentUser={currentUser} />;
      case 'patients':
        return <PatientsView currentUser={currentUser} />;
      case 'doctors':
        return <DoctorsView currentUser={currentUser} />;
      case 'prescriptions':
        return <PrescriptionsView currentUser={currentUser} />;
      case 'medicines':
        return <MedicinesView currentUser={currentUser} setActiveTab={setActiveTab} />;
      case 'treatments':
        return <TreatmentsView currentUser={currentUser} />;
      case 'billing':
        return <BillingView currentUser={currentUser} />;
      case 'equipments':
        return <EquipmentsView currentUser={currentUser} />;
      case 'xray':
        return <XrayReportsView currentUser={currentUser} />;
      case 'roles':
        return <UsersRolesView currentUser={currentUser} />;
      case 'portal':
        return <PortalBookingView setActiveTab={setActiveTab} currentUser={currentUser} />;
      case 'my_portal':
        return <PatientPortalView currentUser={currentUser} setActiveTab={setActiveTab} />;
      default:
        return <DashboardView setActiveTab={setActiveTab} currentUser={currentUser} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      {/* Navigation Sidebar with Role-Based filtering */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBackToWebsite={() => setViewMode('website')}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Header
          activeTab={activeTab}
          currentUser={currentUser}
          onBackToWebsite={() => setViewMode('website')}
          onOpenAuthModal={handleOpenAuthModal}
          onLogout={handleLogout}
        />

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderActiveView()}
        </main>
      </div>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialTab={authModalTab}
      />
    </div>
  );
}
