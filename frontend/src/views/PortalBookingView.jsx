import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { QRCodeSVG } from 'qrcode.react';
import { Globe, Calendar, Clock, User, Phone, Mail, CheckCircle2, Video, MapPin, QrCode } from 'lucide-react';

export default function PortalBookingView({ setActiveTab }) {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotTime, setSelectedSlotTime] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');

  // Patient info
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [complaint, setComplaint] = useState('');
  const [urgency, setUrgency] = useState('normal');

  // Confirmation state
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const res = await api.getDoctors();
      if (res.success && res.data.length > 0) {
        setDoctors(res.data);
        setSelectedDoctorId(res.data[0].id);
        setSelectedDoctor(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    }
  };

  useEffect(() => {
    if (selectedDoctorId) {
      const doc = doctors.find((d) => d.id === parseInt(selectedDoctorId));
      setSelectedDoctor(doc);
      if (bookingDate) {
        loadDoctorSlots(selectedDoctorId, bookingDate);
      }
    }
  }, [selectedDoctorId, bookingDate]);

  const loadDoctorSlots = async (docId, date) => {
    try {
      const res = await api.getAvailableSlots(docId, date);
      if (res.success) {
        setAvailableSlots(res.data);
        const freeSlot = res.data.find((s) => !s.is_booked);
        if (freeSlot) {
          setSelectedSlotTime(freeSlot.time);
          setSelectedShiftId(freeSlot.shift_id);
        } else {
          setSelectedSlotTime('');
        }
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
    }
  };

  const handlePortalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlotTime) {
      alert('Please select an available appointment slot.');
      return;
    }

    setIsSubmitting(true);
    try {
      const [hours, minutes] = selectedSlotTime.split(':');
      const apptDateTime = new Date(bookingDate);
      apptDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const res = await api.createAppointment({
        doctor_id: selectedDoctorId,
        shift_id: selectedShiftId || 1,
        appointment_date: apptDateTime.toISOString(),
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_email: patientEmail,
        urgency,
        clinical_notes: complaint,
        slot_duration: '30',
      });

      if (res.success) {
        setBookedAppointment(res.data);
      }
    } catch (err) {
      alert('Booking error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '880px', margin: '0 auto' }}>
      {/* Banner */}
      <div style={{
        backgroundColor: '#0284c7',
        color: '#ffffff',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '2rem',
        textAlign: 'center',
        boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.3)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          <Globe size={14} /> PUBLIC PATIENT SELF-SERVICE PORTAL
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Schedule Your Physiotherapy Appointment
        </h2>
        <p style={{ fontSize: '0.9rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
          Choose your physical therapist, find convenient shift slots, and receive instant clinic confirmation with digital QR token.
        </p>
      </div>

      {bookedAppointment ? (
        /* Success Screen with Real QR */
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid #e2e8f0',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <CheckCircle2 size={36} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Appointment Confirmed!
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Your consultation request has been booked into the clinic scheduling system.
          </p>

          {/* REAL DYNAMIC QR CODE DISPLAY */}
          <div style={{ display: 'inline-block', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1.5px solid #0284c7', marginBottom: '1.5rem' }}>
            <QRCodeSVG
              value={`PHYSIO:${bookedAppointment.appointment_no}`}
              size={130}
              level="H"
              includeMargin={true}
            />
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', marginTop: '0.5rem' }}>
              Check-in QR: {bookedAppointment.appointment_no}
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', maxWidth: '440px', margin: '0 auto 1.5rem', textAlign: 'left', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Appointment Ref:</span>
              <strong style={{ color: '#0284c7' }}>{bookedAppointment.appointment_no}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Patient Name:</span>
              <strong>{bookedAppointment.patient_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Physiotherapist:</span>
              <strong>{bookedAppointment.doctor_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Date & Time:</span>
              <strong>{new Date(bookedAppointment.appointment_date).toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Consultation Fee:</span>
              <strong style={{ color: '#0f172a' }}>₹{bookedAppointment.consultation_fee}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => {
                setBookedAppointment(null);
                setPatientName('');
                setPatientPhone('');
                setComplaint('');
              }}
            >
              Book Another Appointment
            </button>
            <button className="btn btn-primary" onClick={() => setActiveTab('appointments')}>
              View in Clinic Desk
            </button>
          </div>
        </div>
      ) : (
        /* Booking Form */
        <form onSubmit={handlePortalSubmit} style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid #e2e8f0',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
              Select Physiotherapist & Date
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Doctor / Specialist</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization_name}) • ₹{d.consultation_fee}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Preferred Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
              Choose Time Slot
            </h4>

            {availableSlots.length === 0 ? (
              <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                No active clinical shifts or doctor is off-duty on this date. Please select another date.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.65rem' }}>
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
                        padding: '0.65rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        backgroundColor: slot.is_booked ? '#f1f5f9' : isSelected ? '#e0f2fe' : '#ffffff',
                        color: slot.is_booked ? '#94a3b8' : isSelected ? '#0284c7' : '#1e293b',
                        cursor: slot.is_booked ? 'not-allowed' : 'pointer',
                        textDecoration: slot.is_booked ? 'line-through' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
              Your Contact & Health Details
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 00000"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="ramesh@email.com"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Urgency Level</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                >
                  <option value="normal">Routine / Follow-up Consultation</option>
                  <option value="urgent">Acute Pain / Post-Trauma Rehab</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Primary Physical Complaint / Symptoms</label>
              <textarea
                rows="2"
                placeholder="Describe your symptoms (e.g. severe cervical neck pain radiating into left shoulder for past 2 weeks...)"
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
              ></textarea>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ fontSize: '1rem', padding: '0.75rem 1.75rem' }}
            >
              {isSubmitting ? 'Confirming Appointment...' : 'Book Appointment Now'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
