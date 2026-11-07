import React, { useState } from 'react';
import { api } from '../api';
import { User, Lock, Mail, Phone, Calendar, Heart, Shield, CheckCircle2, UserPlus, LogIn } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialTab = 'login' }) {
  const [tab, setTab] = useState(initialTab); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    date_of_birth: '',
    gender: 'male',
    blood_group: 'O+',
    address: '',
    medical_history: '',
    allergies: 'None',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await api.login({
        email: loginEmail,
        password: loginPassword,
      });

      if (res.success && res.user) {
        onAuthSuccess(res.user, res.token);
        onClose();
      } else {
        setErrorMessage(res.message || 'Invalid login credentials');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoUser) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.login(demoUser);
      if (res.success && res.user) {
        onAuthSuccess(res.user, res.token);
        onClose();
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await api.register(registerData);
      if (res.success && res.user) {
        alert(`🎉 Welcome to PhysioCare! Your Patient Profile has been created under Patient ID: ${res.user.patient_code || 'PAT-NEW'}. You are now added to the clinic system.`);
        onAuthSuccess(res.user, res.token);
        onClose();
      } else {
        setErrorMessage(res.message || 'Registration failed');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: tab === 'register' ? '680px' : '440px',
        padding: '2rem',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.2s ease',
      }}>
        {/* Header Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => { setTab('login'); setErrorMessage(''); }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                fontWeight: tab === 'login' ? 800 : 600,
                color: tab === 'login' ? '#0284c7' : '#64748b',
                borderBottom: tab === 'login' ? '2px solid #0284c7' : 'none',
                paddingBottom: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <LogIn size={16} /> Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setErrorMessage(''); }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                fontWeight: tab === 'register' ? 800 : 600,
                color: tab === 'register' ? '#0284c7' : '#64748b',
                borderBottom: tab === 'register' ? '2px solid #0284c7' : 'none',
                paddingBottom: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <UserPlus size={16} /> Register as Patient
            </button>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>✕</button>
        </div>

        {errorMessage && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {errorMessage}
          </div>
        )}

        {/* 1. LOGIN TAB */}
        {tab === 'login' ? (
          <div>
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. admin@physioclinic.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
              >
                {loading ? 'Signing in...' : 'Sign In to Account'}
              </button>
            </form>

            {/* Quick Demo Logins */}
            <div style={{ marginTop: '1.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                One-Click Quick Login:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin({ email: 'admin@physioclinic.com', role: 'admin' })}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '0.4rem' }}
                >
                  👑 Administrator
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin({ email: 'arvind.nair@physioclinic.com', role: 'doctor' })}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '0.4rem' }}
                >
                  🩺 Dr. Arvind Nair
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin({ email: 'receptionist@physioclinic.com', role: 'receptionist' })}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '0.4rem' }}
                >
                  📋 Reception Desk
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin({ email: 'rahul.mehta@email.com', role: 'patient' })}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '0.4rem' }}
                >
                  👤 Rahul (Patient)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 2. REGISTER NEW PATIENT TAB (ODOO ENROLLMENT) */
          <div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Fill in your medical details. Once registered, you will be automatically added to the clinic's <strong>Patients Directory</strong> with a unique Patient Code.
            </p>

            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suresh Kumar"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="suresh@email.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Create Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Date of Birth</label>
                  <input
                    type="date"
                    value={registerData.date_of_birth}
                    onChange={(e) => setRegisterData({ ...registerData, date_of_birth: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Gender</label>
                  <select
                    value={registerData.gender}
                    onChange={(e) => setRegisterData({ ...registerData, gender: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Blood Group</label>
                  <select
                    value={registerData.blood_group}
                    onChange={(e) => setRegisterData({ ...registerData, blood_group: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Residential Address / City</label>
                <input
                  type="text"
                  placeholder="Street address, city"
                  value={registerData.address}
                  onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Past Physical Ailment / Symptoms</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Lumbar disc ache, knee pain when walking, neck spasm"
                  value={registerData.medical_history}
                  onChange={(e) => setRegisterData({ ...registerData, medical_history: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Known Drug/Food Allergies</label>
                  <input
                    type="text"
                    placeholder="None or penicillin/dust"
                    value={registerData.allergies}
                    onChange={(e) => setRegisterData({ ...registerData, allergies: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Emergency Contact (Name & Phone)</label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Sharma - 9876543210"
                    value={registerData.emergency_contact_name}
                    onChange={(e) => setRegisterData({ ...registerData, emergency_contact_name: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
                  {loading ? 'Creating Patient Profile...' : 'Complete Registration & Enroll'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
