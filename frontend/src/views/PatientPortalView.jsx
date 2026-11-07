import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  Clock,
  FileText,
  Receipt,
  User,
  HeartPulse,
  Plus,
  Printer,
  CreditCard,
  CheckCircle2,
  Video,
} from 'lucide-react';

export default function PatientPortalView({ currentUser, setActiveTab }) {
  const [activeSubTab, setActiveSubTab] = useState('appointments'); // 'appointments', 'prescriptions', 'invoices', 'profile'
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [activeSlip, setActiveSlip] = useState(null);
  const [activePrescription, setActivePrescription] = useState(null);
  const [activeInvoice, setActiveInvoice] = useState(null);

  const patientId = currentUser?.patient_id || 1;

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const [apptRes, prRes, invRes] = await Promise.all([
        api.getAppointments({ patient_id: patientId }),
        api.getPrescriptions({ patient_id: patientId }),
        api.getInvoices({ patient_id: patientId }),
      ]);

      if (apptRes.success) setAppointments(apptRes.data);
      if (prRes.success) setPrescriptions(prRes.data);
      if (invRes.success) setInvoices(invRes.data);
    } catch (err) {
      console.error('Failed to load patient portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Patient Welcome Header */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        border: '1px solid #e2e8f0',
        padding: '1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '1rem',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.3rem',
          }}>
            {currentUser?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'PT'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{currentUser?.name}</h2>
              <span style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                {currentUser?.patient_code || 'PAT-001'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
              Patient Portal • {currentUser?.email} • {currentUser?.phone || '+91 98765 43210'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('portal')}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> Book New Appointment
        </button>
      </div>

      {/* Sub-Tabs Navigation for Patient */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {[
          { id: 'appointments', label: `My Appointments (${appointments.length})`, icon: Calendar },
          { id: 'prescriptions', label: `My Prescriptions (${prescriptions.length})`, icon: FileText },
          { id: 'invoices', label: `My Bills & Receipts (${invoices.length})`, icon: Receipt },
          { id: 'profile', label: 'Health Profile', icon: User },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                backgroundColor: isActive ? '#0284c7' : 'transparent',
                color: isActive ? '#ffffff' : '#64748b',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. APPOINTMENTS TAB */}
      {activeSubTab === 'appointments' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table className="clinic-table">
            <thead>
              <tr>
                <th>Appointment No.</th>
                <th>Doctor</th>
                <th>Date & Time</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Fee</th>
                <th style={{ textAlign: 'right' }}>Slip / QR</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    You have no scheduled appointments yet. Click "Book New Appointment" to schedule one.
                  </td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 700, color: '#0284c7' }}>{a.appointment_no}</td>
                    <td>{a.doctor_name}</td>
                    <td>
                      <div>{new Date(a.appointment_date).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({a.slot_duration}m)
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: a.urgency === 'urgent' ? '#dc2626' : '#64748b' }}>
                        {a.urgency}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${a.status}`}>
                        {a.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{a.consultation_fee}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setActiveSlip(a)}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        <Printer size={14} /> View Slip & QR
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. PRESCRIPTIONS TAB */}
      {activeSubTab === 'prescriptions' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table className="clinic-table">
            <thead>
              <tr>
                <th>Rx No.</th>
                <th>Date</th>
                <th>Doctor</th>
                <th>Diagnosis</th>
                <th>Therapy Modality</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    No prescriptions issued yet.
                  </td>
                </tr>
              ) : (
                prescriptions.map((pr) => (
                  <tr key={pr.id}>
                    <td style={{ fontWeight: 700, color: '#0284c7' }}>{pr.sequence_no}</td>
                    <td>{pr.prescription_date}</td>
                    <td>{pr.doctor_name}</td>
                    <td style={{ fontWeight: 600 }}>{pr.diagnosis}</td>
                    <td>
                      <span style={{ backgroundColor: '#f0fdf4', color: '#15803d', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {pr.treatment_name || 'General Therapy'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-done" style={{ textTransform: 'capitalize' }}>
                        {pr.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setActivePrescription(pr)}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        <Printer size={14} /> View Rx Slip
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. INVOICES TAB */}
      {activeSubTab === 'invoices' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table className="clinic-table">
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Total Fee</th>
                <th>Paid Amount</th>
                <th>Due Balance</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    No billing invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 700, color: '#0284c7' }}>{inv.invoice_no}</td>
                    <td style={{ fontWeight: 700 }}>₹{inv.total_amount}</td>
                    <td style={{ fontWeight: 600, color: '#16a34a' }}>₹{inv.paid_amount}</td>
                    <td style={{ fontWeight: 700, color: inv.total_amount - inv.paid_amount > 0 ? '#dc2626' : '#64748b' }}>
                      ₹{inv.total_amount - inv.paid_amount}
                    </td>
                    <td>
                      <span className={`badge badge-${inv.status}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setActiveInvoice(inv)}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        <Printer size={14} /> Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. HEALTH PROFILE TAB */}
      {activeSubTab === 'profile' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>Medical Demographics & Health Profile</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Patient Identification Code:</span>
              <strong style={{ color: '#0284c7' }}>{currentUser?.patient_code || 'PAT-001'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Blood Group:</span>
              <strong style={{ color: '#b91c1c' }}>O+</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Primary Physical Complaint / History:</span>
              <p style={{ marginTop: '0.25rem', color: '#334155' }}>Lower back pain with lumbar stiffness; desk job posture issues.</p>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Documented Drug Allergies:</span>
              <strong style={{ color: '#16a34a' }}>None</strong>
            </div>
          </div>
        </div>
      )}

      {/* VIEW APPOINTMENT SLIP MODAL */}
      {activeSlip && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '100%', maxWidth: '520px', padding: '2rem' }}>
            <div className="printable-area" style={{ border: '2px dashed #0284c7', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: '#fcfcfd' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>PhysioCare Advanced Rehabilitation</h3>
                <span style={{ backgroundColor: '#0284c7', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  PATIENT APPOINTMENT TOKEN
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <div>Token: <strong>{activeSlip.appointment_no}</strong></div>
                <div>Status: <strong style={{ textTransform: 'capitalize' }}>{activeSlip.status}</strong></div>
                <div>Doctor: <strong>{activeSlip.doctor_name}</strong></div>
                <div>Fee: <strong>₹{activeSlip.consultation_fee}</strong></div>
                <div style={{ gridColumn: 'span 2' }}>
                  Time: <strong>{new Date(activeSlip.appointment_date).toLocaleString()}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.375rem', gap: '1rem' }}>
                <QRCodeSVG value={`PHYSIO:${activeSlip.appointment_no}`} size={84} level="H" />
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  <p style={{ fontWeight: 700, color: '#0f172a' }}>Scan at Reception Desk</p>
                  <p>Present this token upon arrival at the clinic for instant check-in.</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }} className="no-print">
              <button className="btn btn-outline" onClick={() => setActiveSlip(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW PRESCRIPTION SLIP MODAL */}
      {activePrescription && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '100%', maxWidth: '600px', padding: '2rem' }}>
            <div className="printable-area" style={{ border: '2px solid #0f172a', padding: '1.75rem', backgroundColor: '#ffffff' }}>
              <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>PhysioCare Advanced Rehabilitation</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Clinical Prescription Slip (Rx)</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                  <strong>{activePrescription.doctor_name}</strong>
                  <div style={{ color: '#64748b' }}>{activePrescription.prescription_date}</div>
                </div>
              </div>

              <div style={{ padding: '0.75rem 0', fontSize: '0.85rem' }}>
                <div>Rx No: <strong>{activePrescription.sequence_no}</strong></div>
                <div>Diagnosis: <strong style={{ color: '#0284c7' }}>{activePrescription.diagnosis}</strong></div>
              </div>

              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0284c7' }}>℞</div>
              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '0.35rem' }}>Medicine</th>
                    <th style={{ padding: '0.35rem' }}>Dosage</th>
                    <th style={{ padding: '0.35rem' }}>Timing</th>
                    <th style={{ padding: '0.35rem' }}>Days</th>
                    <th style={{ padding: '0.35rem' }}>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {(activePrescription.medicines || []).map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.35rem', fontWeight: 600 }}>{m.medicine_name}</td>
                      <td style={{ padding: '0.35rem' }}>{m.dosage}</td>
                      <td style={{ padding: '0.35rem', fontWeight: 700 }}>{m.frequency}</td>
                      <td style={{ padding: '0.35rem' }}>{m.days} d</td>
                      <td style={{ padding: '0.35rem', color: '#64748b' }}>{m.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {activePrescription.notes && (
                <div style={{ marginTop: '1rem', backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                  <strong>Home Rehab Advice: </strong>{activePrescription.notes}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }} className="no-print">
              <button className="btn btn-outline" onClick={() => setActivePrescription(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print Rx Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW INVOICE MODAL */}
      {activeInvoice && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '100%', maxWidth: '520px', padding: '2rem' }}>
            <div className="printable-area" style={{ border: '1px solid #cbd5e1', padding: '1.5rem', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>PhysioCare Clinic</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Tax Invoice & Receipt</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0284c7' }}>{activeInvoice.invoice_no}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date: {activeInvoice.due_date}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                <div>Total Amount: <strong>₹{activeInvoice.total_amount}</strong></div>
                <div>Paid Amount: <strong style={{ color: '#16a34a' }}>₹{activeInvoice.paid_amount}</strong></div>
                <div>Status: <span className={`badge badge-${activeInvoice.status}`}>{activeInvoice.status}</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }} className="no-print">
              <button className="btn btn-outline" onClick={() => setActiveInvoice(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
