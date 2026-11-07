import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  Plus,
  Clock,
  Printer,
  Check,
  Play,
  XCircle,
  Video,
  QrCode,
  ScanLine,
  Search,
  CheckCircle2,
} from 'lucide-react';

export default function AppointmentsView() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [activeSlip, setActiveSlip] = useState(null);

  // QR Scanner / Reception Desk Check-in Modal
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [verifiedAppointment, setVerifiedAppointment] = useState(null);
  const [scanMessage, setScanMessage] = useState('');

  // Booking Form state
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotTime, setSelectedSlotTime] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [slotDuration, setSlotDuration] = useState('30');
  const [clinicalNotes, setClinicalNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [apptRes, docRes, patRes, shiftRes] = await Promise.all([
        api.getAppointments(statusFilter ? { status: statusFilter } : {}),
        api.getDoctors(),
        api.getPatients(),
        api.getShifts(),
      ]);

      if (apptRes.success) setAppointments(apptRes.data);
      if (docRes.success) {
        setDoctors(docRes.data);
        if (docRes.data.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(docRes.data[0].id);
        }
      }
      if (patRes.success) {
        setPatients(patRes.data);
        if (patRes.data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(patRes.data[0].id);
        }
      }
      if (shiftRes.success) {
        setShifts(shiftRes.data);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDoctorId && bookingDate) {
      loadSlots(selectedDoctorId, bookingDate);
    }
  }, [selectedDoctorId, bookingDate]);

  const loadSlots = async (docId, date) => {
    try {
      const res = await api.getAvailableSlots(docId, date);
      if (res.success) {
        setAvailableSlots(res.data);
        const firstAvailable = res.data.find((s) => !s.is_booked);
        if (firstAvailable) {
          setSelectedSlotTime(firstAvailable.time);
          setSelectedShiftId(firstAvailable.shift_id);
        } else {
          setSelectedSlotTime('');
        }
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!selectedSlotTime) {
      alert('Please select an available time slot');
      return;
    }

    const [hours, minutes] = selectedSlotTime.split(':');
    const apptDateTime = new Date(bookingDate);
    apptDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    try {
      const res = await api.createAppointment({
        patient_id: selectedPatientId,
        doctor_id: selectedDoctorId,
        shift_id: selectedShiftId || 1,
        appointment_date: apptDateTime.toISOString(),
        slot_duration: slotDuration,
        urgency,
        clinical_notes: clinicalNotes,
      });

      if (res.success) {
        setIsBookModalOpen(false);
        setClinicalNotes('');
        loadData();
      }
    } catch (err) {
      alert('Failed to book appointment: ' + err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await api.updateAppointmentStatus(id, newStatus);
      if (res.success) {
        loadData();
        if (verifiedAppointment && verifiedAppointment.id === id) {
          setVerifiedAppointment({ ...verifiedAppointment, status: newStatus });
        }
      }
    } catch (err) {
      alert('Status change error: ' + err.message);
    }
  };

  const openSlipModal = (appt) => {
    setActiveSlip(appt);
    setIsSlipModalOpen(true);
  };

  // QR Code Verification / Check-in logic
  const handleVerifyQr = async (codeToVerify) => {
    const code = codeToVerify || scannedCode;
    if (!code) return;
    setScanMessage('Verifying QR Code token...');

    try {
      const res = await api.verifyAppointmentQr(code);
      if (res.success && res.data) {
        setVerifiedAppointment(res.data);
        setScanMessage('');
      } else {
        setVerifiedAppointment(null);
        setScanMessage('❌ Appointment not found for this QR Code.');
      }
    } catch (err) {
      setVerifiedAppointment(null);
      setScanMessage('❌ Verification failed: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header / Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['', 'draft', 'confirmed', 'in_progress', 'done', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="btn"
              style={{
                fontSize: '0.8rem',
                padding: '0.4rem 0.8rem',
                backgroundColor: statusFilter === st ? '#0284c7' : '#ffffff',
                color: statusFilter === st ? '#ffffff' : '#475569',
                borderColor: statusFilter === st ? '#0284c7' : '#cbd5e1',
                textTransform: 'capitalize',
              }}
            >
              {st === '' ? 'All Appointments' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {/* QR Code Check-in Button */}
          <button
            className="btn btn-outline"
            onClick={() => {
              setIsQrScannerOpen(true);
              setVerifiedAppointment(null);
              setScannedCode('');
              setScanMessage('');
            }}
            style={{ color: '#0f766e', borderColor: '#99f6e4', backgroundColor: '#f0fdfa' }}
          >
            <ScanLine size={16} /> QR Reception Check-in
          </button>

          <button className="btn btn-primary" onClick={() => setIsBookModalOpen(true)}>
            <Plus size={16} /> New Appointment
          </button>
        </div>
      </div>

      {/* Appointments Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="clinic-table">
          <thead>
            <tr>
              <th>Appt No.</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Shift & Time</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Fee</th>
              <th>QR Token</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading appointments...
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  No appointments found for selected filter.
                </td>
              </tr>
            ) : (
              appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#0284c7' }}>{appt.appointment_no}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{appt.patient_name}</div>
                  </td>
                  <td>{appt.doctor_name}</td>
                  <td>
                    <div>{new Date(appt.appointment_date).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({appt.slot_duration}m)
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: appt.urgency === 'urgent' ? '#dc2626' : '#64748b',
                        textTransform: 'uppercase',
                      }}
                    >
                      {appt.urgency}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${appt.status}`}>
                      {appt.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{appt.consultation_fee}</td>
                  <td>
                    {/* Small clickable QR badge */}
                    <button
                      onClick={() => openSlipModal(appt)}
                      title="View Scannable QR Code"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '0.2rem 0.4rem',
                        fontSize: '0.75rem',
                        color: '#0f172a',
                        cursor: 'pointer',
                      }}
                    >
                      <QrCode size={13} color="#0284c7" />
                      <span>Scan</span>
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      {appt.status === 'draft' && (
                        <button
                          title="Confirm Appointment"
                          onClick={() => handleStatusChange(appt.id, 'confirmed')}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: '#0284c7' }}
                        >
                          <Check size={14} /> Confirm
                        </button>
                      )}
                      {appt.status === 'confirmed' && (
                        <button
                          title="Start Therapy Session"
                          onClick={() => handleStatusChange(appt.id, 'in_progress')}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: '#d97706' }}
                        >
                          <Play size={14} /> Start
                        </button>
                      )}
                      {appt.status === 'in_progress' && (
                        <button
                          title="Mark Session Done"
                          onClick={() => handleStatusChange(appt.id, 'done')}
                          className="btn btn-success"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          <Check size={14} /> Done
                        </button>
                      )}
                      {appt.status !== 'cancelled' && appt.status !== 'done' && (
                        <button
                          title="Cancel"
                          onClick={() => handleStatusChange(appt.id, 'cancelled')}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: '#dc2626' }}
                        >
                          <XCircle size={14} />
                        </button>
                      )}

                      {/* Appointment Slip button */}
                      <button
                        title="Print Appointment Slip / QR"
                        onClick={() => openSlipModal(appt)}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        <Printer size={14} /> Slip
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* RECEPTION QR SCANNER / CHECK-IN MODAL */}
      {isQrScannerOpen && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '100%', maxWidth: '560px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ScanLine size={20} color="#0f766e" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Reception QR Code Check-in</h3>
              </div>
              <button onClick={() => setIsQrScannerOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Scan the patient's appointment QR code with a barcode scanner or enter the token number below to verify check-in:
            </p>

            {/* Quick Sample Token Buttons */}
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                Quick Test Existing Appointments:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {appointments.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setScannedCode(a.appointment_no);
                      handleVerifyQr(a.appointment_no);
                    }}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      cursor: 'pointer',
                    }}
                  >
                    {a.appointment_no} ({a.patient_name.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>

            {/* Search / Scan Input */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                type="text"
                placeholder="Scan QR payload or enter token (e.g. APP-2026-001)"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVerifyQr();
                }}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
              <button className="btn btn-primary" onClick={() => handleVerifyQr()}>
                <Search size={16} /> Verify
              </button>
            </div>

            {scanMessage && (
              <p style={{ fontSize: '0.85rem', color: '#dc2626', marginBottom: '1rem', fontWeight: 600 }}>{scanMessage}</p>
            )}

            {/* Verified Appointment Details Box */}
            {verifiedAppointment && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: 800, marginBottom: '0.75rem' }}>
                  <CheckCircle2 size={18} /> Valid Appointment Verified!
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.85rem', color: '#1e293b' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Appointment No:</span>
                    <div style={{ fontWeight: 800, color: '#0284c7' }}>{verifiedAppointment.appointment_no}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Status:</span>
                    <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{verifiedAppointment.status}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Patient Name:</span>
                    <div style={{ fontWeight: 700 }}>{verifiedAppointment.patient_name}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Doctor:</span>
                    <div style={{ fontWeight: 600 }}>{verifiedAppointment.doctor_name}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Time & Shift:</span>
                    <div>{new Date(verifiedAppointment.appointment_date).toLocaleString()}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Consultation Fee:</span>
                    <div style={{ fontWeight: 700 }}>₹{verifiedAppointment.consultation_fee}</div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px solid #bbf7d0', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  {verifiedAppointment.status === 'confirmed' && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleStatusChange(verifiedAppointment.id, 'in_progress')}
                    >
                      <Play size={14} /> Mark Patient Arrived & Start Session
                    </button>
                  )}
                  {verifiedAppointment.status === 'in_progress' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleStatusChange(verifiedAppointment.id, 'done')}
                    >
                      <Check size={14} /> Complete Session
                    </button>
                  )}
                  {verifiedAppointment.status === 'done' && (
                    <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 700 }}>
                      Session Already Completed ✓
                    </span>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setIsQrScannerOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* BOOK APPOINTMENT MODAL */}
      {isBookModalOpen && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '100%', maxWidth: '640px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Schedule New Appointment</h3>
              <button onClick={() => setIsBookModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Select Patient *
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.patient_code}) - {p.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Physiotherapist / Doctor *
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization_name}) - ₹{d.consultation_fee}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Slot Duration
                  </label>
                  <select
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes (Standard)</option>
                    <option value="60">1 Hour</option>
                    <option value="120">2 Hours</option>
                  </select>
                </div>
              </div>

              {/* Real-time Time Slots calculated from Doctor Shifts */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                  Available Doctor Shifts & Slots (Real-time Odoo Logic):
                </label>
                {availableSlots.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: '#dc2626' }}>Doctor has no shifts or is not available on this day.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                    {availableSlots.map((slot, idx) => {
                      const isSelected = selectedSlotTime === slot.time;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={slot.is_booked}
                          onClick={() => {
                            setSelectedSlotTime(slot.time);
                            setSelectedShiftId(slot.shift_id);
                          }}
                          style={{
                            padding: '0.4rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                            backgroundColor: slot.is_booked
                              ? '#f1f5f9'
                              : isSelected
                              ? '#e0f2fe'
                              : '#ffffff',
                            color: slot.is_booked
                              ? '#94a3b8'
                              : isSelected
                              ? '#0284c7'
                              : '#334155',
                            cursor: slot.is_booked ? 'not-allowed' : 'pointer',
                            textDecoration: slot.is_booked ? 'line-through' : 'none',
                          }}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedSlotTime && (
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: '0.25rem', display: 'block' }}>
                    ✓ Selected Slot: {selectedSlotTime}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Urgency
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    <option value="normal">Normal Consultation</option>
                    <option value="urgent">Urgent / Acute Pain</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Clinical Condition / Complaint
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lower back spasm, Knee pain"
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsBookModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPOINTMENT SLIP / REAL SCANNABLE QR MODAL */}
      {isSlipModalOpen && activeSlip && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '100%', maxWidth: '540px', padding: '2rem' }}>
            <div className="printable-area" style={{ border: '2px dashed #0284c7', borderRadius: '0.5rem', padding: '1.75rem', backgroundColor: '#fcfcfd' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>PhysioCare Advanced Rehabilitation</h2>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Musculoskeletal & Sports Physical Therapy Clinic</p>
                <div style={{ display: 'inline-block', backgroundColor: '#0284c7', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', marginTop: '0.25rem' }}>
                  OFFICIAL APPOINTMENT SLIP
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Appointment No:</span>
                  <div style={{ fontWeight: 700, color: '#0284c7' }}>{activeSlip.appointment_no}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Status:</span>
                  <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{activeSlip.status}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Patient Name:</span>
                  <div style={{ fontWeight: 600 }}>{activeSlip.patient_name}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Doctor:</span>
                  <div style={{ fontWeight: 600 }}>{activeSlip.doctor_name}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Date & Time:</span>
                  <div style={{ fontWeight: 600 }}>
                    {new Date(activeSlip.appointment_date).toLocaleDateString()} @ {new Date(activeSlip.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Consultation Fee:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>₹{activeSlip.consultation_fee}</div>
                </div>
              </div>

              {activeSlip.zoom_meeting_url && (
                <div style={{ backgroundColor: '#e0f2fe', padding: '0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#0369a1', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Video size={16} />
                  <span>Tele-consultation Link: {activeSlip.zoom_meeting_url}</span>
                </div>
              )}

              {/* REAL DYNAMIC SCANNABLE QR CODE BOX */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '0.5rem', gap: '1.25rem' }}>
                <QRCodeSVG
                  value={`PHYSIO:${activeSlip.appointment_no}`}
                  size={96}
                  level="H"
                  includeMargin={true}
                />
                <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'left' }}>
                  <p style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>Dynamic Reception Check-in QR</p>
                  <p style={{ color: '#0284c7', fontWeight: 600, margin: '2px 0' }}>Token: {activeSlip.appointment_no}</p>
                  <p>Scan with any mobile camera or clinic desk barcode scanner for instant check-in.</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }} className="no-print">
              <button className="btn btn-outline" onClick={() => setIsSlipModalOpen(false)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
