import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { QRCodeSVG } from 'qrcode.react';
import {
  Activity,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Award,
  ArrowRight,
  UserCheck,
  Star,
  ChevronRight,
  Sparkles,
  HeartPulse,
  QrCode,
  Smartphone,
  LogIn,
  UserPlus,
  User,
  LogOut,
  Check,
  Zap,
  Stethoscope,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  Printer,
  Shield,
} from 'lucide-react';
import PaymentModal from '../components/PaymentModal';

export default function WebsiteView({ onEnterPortal, currentUser, onOpenAuthModal, onLogout }) {
  const [doctors, setDoctors] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  // QR Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Booking widget states
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotTime, setSelectedSlotTime] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');

  const [patientName, setPatientName] = useState(currentUser?.name || '');
  const [patientPhone, setPatientPhone] = useState(currentUser?.phone || '');
  const [patientEmail, setPatientEmail] = useState(currentUser?.email || '');
  const [clinicalComplaint, setClinicalComplaint] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Online Payment State
  const [paymentChoice, setPaymentChoice] = useState('online'); // 'online' | 'clinic'
  const [isOnlinePayModalOpen, setIsOnlinePayModalOpen] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Curated high-resolution physiotherapy and healthcare images
  const treatmentImages = {
    1: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80', // Manual Therapy
    2: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80', // Electrotherapy / Ultrasound
    3: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80', // Exercise & Posture Rehab
    4: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', // Traction Decompression
    5: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80', // Laser Therapy
  };

  const doctorImages = {
    1: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80', // Dr. Arvind Nair
    2: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80', // Dr. Meena Joshi
  };

  useEffect(() => {
    loadWebsiteData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setPatientName(currentUser.name || '');
      setPatientPhone(currentUser.phone || '');
      setPatientEmail(currentUser.email || '');
    }
  }, [currentUser]);

  const loadWebsiteData = async () => {
    try {
      const [docRes, trRes] = await Promise.all([
        api.getDoctors(),
        api.getTreatments(),
      ]);

      if (docRes.success && docRes.data.length > 0) {
        setDoctors(docRes.data);
        if (!selectedDocId) {
          setSelectedDocId(docRes.data[0].id);
        }
      }
      if (trRes.success) {
        setTreatments(trRes.data);
      }
    } catch (err) {
      console.error('Website data load error:', err);
    }
  };

  useEffect(() => {
    if (selectedDocId && selectedDate) {
      loadSlots(selectedDocId, selectedDate);
    }
  }, [selectedDocId, selectedDate]);

  const loadSlots = async (docId, date) => {
    try {
      const res = await api.getAvailableSlots(docId, date);
      if (res.success && res.data.length > 0) {
        setAvailableSlots(res.data);
        const free = res.data.find((s) => !s.is_booked);
        if (free) {
          setSelectedSlotTime(free.time);
          setSelectedShiftId(free.shift_id);
        } else {
          setSelectedSlotTime('');
        }
      }
    } catch (err) {
      console.error('Slots error:', err);
    }
  };

  const handleWebsiteBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlotTime) {
      alert('Please select an available appointment slot');
      return;
    }

    setIsSubmitting(true);
    try {
      const [hours, minutes] = selectedSlotTime.split(':');
      const apptDateTime = new Date(selectedDate);
      apptDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const doctor = doctors.find((d) => String(d.id) === String(selectedDocId));
      const consultationFee = doctor?.consultation_fee || 600;

      const res = await api.createAppointment({
        doctor_id: selectedDocId,
        shift_id: selectedShiftId || 1,
        appointment_date: apptDateTime.toISOString(),
        patient_id: currentUser?.patient_id || null,
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_email: patientEmail,
        clinical_notes: clinicalComplaint,
        urgency: 'normal',
        slot_duration: '30',
      });

      if (res.success) {
        if (paymentChoice === 'online') {
          setPendingBookingData({ ...res.data, consultation_fee: consultationFee });
          setIsOnlinePayModalOpen(true);
        } else {
          setBookingSuccess({
            ...res.data,
            payment_status: 'unpaid',
            payment_method: 'pay_at_clinic',
          });
        }
      }
    } catch (err) {
      alert('Booking error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnlinePaymentSuccess = (paymentDetails) => {
    setIsOnlinePayModalOpen(false);
    setBookingSuccess({
      ...pendingBookingData,
      payment_status: 'paid',
      payment_ref: paymentDetails.transaction_id,
      payment_method: paymentDetails.payment_method,
      amount_paid: paymentDetails.amount,
      receipt_no: paymentDetails.receipt_no,
    });
  };

  const scrollToBooking = (docId = null) => {
    if (docId) setSelectedDocId(docId);
    const element = document.getElementById('booking-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const bookingUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const categories = ['All', 'Restorative Therapy', 'Rehabilitative Therapy', 'Advanced Modalities'];

  const filteredTreatments = activeCategory === 'All'
    ? treatments
    : treatments.filter((t) => t.category_name?.toLowerCase().includes(activeCategory.toLowerCase().split(' ')[0]));

  const faqs = [
    {
      q: 'Do I need a doctor referral or prescription before visiting?',
      a: 'No prior doctor referral is required. Our licensed senior physiotherapists conduct an extensive initial musculoskeletal evaluation, movement screen, and diagnostic physical testing before starting customized therapy protocols.',
    },
    {
      q: 'How does the QR Code appointment slip work at reception?',
      a: 'When you book an appointment, a verified QR token (e.g. APP-2026-001) is automatically generated. When you arrive at our clinic, simply show this QR code on your phone or printed slip at the front desk for instant contactless check-in.',
    },
    {
      q: 'How many sessions are typically required for chronic back or neck pain?',
      a: 'Most acute muscle spasms improve in 3 to 5 sessions. Chronic cervical spondylosis, lumbar disc herniation, or post-surgical joint rehabilitation typically require 8 to 12 sessions combining electrotherapy, manual joint mobilization, and active spinal stabilization exercises.',
    },
    {
      q: 'What should I wear to my physiotherapy session?',
      a: 'Please wear comfortable, loose-fitting athletic clothing (such as track pants, shorts, or t-shirts) that allows free range of motion and easy physical examination of the spine, shoulders, or knee joints.',
    },
  ];

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif", color: '#0f172a' }}>
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div style={{
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        fontSize: '0.8rem',
        padding: '0.55rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        borderBottom: '1px solid #1e293b',
      }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e1' }}>
            <Phone size={13} color="#38bdf8" /> <strong>Emergency & Helpline:</strong> +91 99000 11000
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Mail size={13} color="#38bdf8" /> contact@physiocare.clinic
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={13} color="#38bdf8" /> Mon - Sat: 08:00 AM - 09:00 PM (3 Daily Shifts)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setIsQrModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <QrCode size={14} /> Scan QR for Mobile Booking
          </button>
        </div>
      </div>

      {/* 2. MAIN NAVBAR */}
      <header style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e2e8f0',
        zIndex: 40,
        padding: '0.85rem 2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0f766e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
          }}>
            <HeartPulse size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                PhysioCare
              </span>
              <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                Clinic & ERP
              </span>
            </div>
            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.02em' }}>
              Advanced Pain, Spine & Sports Physical Rehabilitation
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
          <a href="#services" style={{ textDecoration: 'none', color: '#334155', fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.15s' }}>
            Treatments
          </a>
          <a href="#doctors" style={{ textDecoration: 'none', color: '#334155', fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.15s' }}>
            Specialist Doctors
          </a>
          <a href="#technology" style={{ textDecoration: 'none', color: '#334155', fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.15s' }}>
            Clinical Tech
          </a>
          <a href="#booking-section" style={{ textDecoration: 'none', color: '#334155', fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.15s' }}>
            Book Slot
          </a>
          <a href="#reviews" style={{ textDecoration: 'none', color: '#334155', fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.15s' }}>
            Patient Stories
          </a>
          <a href="#faq" style={{ textDecoration: 'none', color: '#334155', fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.15s' }}>
            FAQ
          </a>
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
                <User size={15} color="#0284c7" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{currentUser.name}</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' }}>({currentUser.role})</span>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="btn btn-outline"
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.75rem', color: '#dc2626' }}
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => onOpenAuthModal('login')}
                className="btn btn-outline"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
              >
                <LogIn size={14} /> Sign In
              </button>
              <button
                onClick={() => onOpenAuthModal('register')}
                className="btn btn-primary"
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
              >
                <UserPlus size={14} /> Register Patient
              </button>
            </div>
          )}

          <button
            onClick={onEnterPortal}
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '0.55rem 1.15rem',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f172a')}
          >
            <ShieldCheck size={16} />
            <span>Clinic ERP</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </header>

      {/* 3. HERO SECTION WITH MODERN MEDICAL PHOTOGRAPHY & FLOATING WIDGETS */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 50%, #ffffff 100%)',
        padding: '4.5rem 2.5rem 5.5rem',
        overflow: 'hidden',
        borderBottom: '1px solid #e2e8f0',
      }}>
        {/* Subtle decorative background circle */}
        <div style={{ position: 'absolute', right: '-80px', top: '-80px', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '3.5rem', alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#ccfbf1',
              color: '#0f766e',
              border: '1px solid #99f6e4',
              padding: '0.35rem 0.9rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '1.25rem',
            }}>
              <Sparkles size={14} /> Evidence-Based Physical Therapy & Rehabilitation
            </div>

            <h1 style={{
              fontSize: '3.25rem',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#0f172a',
              marginBottom: '1.25rem',
              letterSpacing: '-0.03em',
            }}>
              Restoring Pain-Free Movement,{' '}
              <span style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0f766e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Transforming Lives.
              </span>
            </h1>

            <p style={{
              fontSize: '1.125rem',
              color: '#475569',
              lineHeight: 1.65,
              marginBottom: '2rem',
              maxWidth: '580px',
            }}>
              Specialized clinical rehabilitation for acute lumbar disc herniation, cervical spondylosis, athletic ligament tears, and post-operative joint mobility using calibrated medical modalities.
            </p>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '2.75rem' }}>
              <button
                onClick={() => scrollToBooking()}
                className="btn btn-primary"
                style={{
                  fontSize: '1rem',
                  padding: '0.85rem 1.85rem',
                  borderRadius: '0.6rem',
                  boxShadow: '0 10px 20px -5px rgba(2, 132, 199, 0.4)',
                }}
              >
                <Calendar size={18} /> Book Consultation &rarr;
              </button>

              <button
                onClick={() => onOpenAuthModal('register')}
                className="btn btn-outline"
                style={{ fontSize: '1rem', padding: '0.85rem 1.6rem', borderRadius: '0.6rem', backgroundColor: '#ffffff' }}
              >
                <UserPlus size={18} /> Register as Patient
              </button>
            </div>

            {/* Key Clinical Proof Points */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.75rem', borderTop: '1px solid #cbd5e1', paddingTop: '1.75rem' }}>
              <div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0284c7', letterSpacing: '-0.02em' }}>15+</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>Years Clinical Experience</div>
              </div>
              <div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f766e', letterSpacing: '-0.02em' }}>12,500+</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>Recovered Patients</div>
              </div>
              <div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#d97706', letterSpacing: '-0.02em' }}>98.6%</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>Patient Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Right Hero: High-Res Medical Photo with Floating Badges */}
          <div style={{ position: 'relative' }}>
            <div style={{
              borderRadius: '1.5rem',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '4px solid #ffffff',
              backgroundColor: '#e2e8f0',
              height: '460px',
              position: 'relative',
            }}>
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=80"
                alt="Physiotherapy Spine Rehabilitation Session"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0) 100%)',
                padding: '2rem 1.5rem 1.25rem',
                color: '#ffffff',
              }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>Clinical Spine & Joint Rehabilitation</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Evidence-based hands-on therapy protocols</div>
              </div>
            </div>

            {/* Floating Card 1: Today's Shift Status */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              left: '-25px',
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              padding: '0.85rem 1.25rem',
              boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>
                  Live Shift Status
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  Morning & Evening Slots Open
                </div>
              </div>
            </div>

            {/* Floating Card 2: QR Token Booking */}
            <div style={{
              position: 'absolute',
              bottom: '-25px',
              right: '-20px',
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              padding: '1rem 1.25rem',
              boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={28} color="#0f766e" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7' }}>Instant Digital Pass</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Fast QR Reception Check-in</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 4 CLINICAL PILLARS (CORE SPECIALTIES) */}
      <section style={{ padding: '4rem 2rem', backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', transition: 'transform 0.15s ease' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Activity size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                Spine & Disc Decompression
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Non-surgical relief for sciatica, cervical spondylosis, pinched nerves, and lumbar disc herniation.
              </p>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Zap size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                Sports Injury & Ligament Rehab
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Return-to-sport protocols for ACL tears, rotator cuff strains, meniscus injuries, and ankle sprains.
              </p>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                Post-Surgical Joint Mobility
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Targeted post-operative rehabilitation for Total Knee Replacement (TKR) and hip arthroplasty recovery.
              </p>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Award size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                Posture & Ergonomic Correction
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Customized corrective exercise programs for tech-neck, scoliosis, muscle imbalances, and desk fatigue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CLINICAL TREATMENTS & MODALITIES (WITH REAL THERAPY PHOTOS) */}
      <section id="services" style={{ padding: '5.5rem 2rem', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Evidence-Based Modalities
            </span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0f172a', marginTop: '0.4rem' }}>
              Physiotherapy Modalities & Rate Catalog
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '640px', margin: '0.5rem auto 0' }}>
              Every therapy session is conducted by certified therapists using hospital-grade calibrated medical equipment.
            </p>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: activeCategory === cat ? '#0284c7' : '#f1f5f9',
                    color: activeCategory === cat ? '#ffffff' : '#475569',
                    fontWeight: activeCategory === cat ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            {filteredTreatments.map((tr) => {
              const imgUrl = treatmentImages[tr.id] || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80';
              return (
                <div
                  key={tr.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '1.25rem',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  {/* Therapy Image */}
                  <div style={{ height: '200px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={imgUrl}
                      alt={tr.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      color: '#38bdf8',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      backdropFilter: 'blur(4px)',
                    }}>
                      {tr.category_name}
                    </span>
                  </div>

                  <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                          {tr.name}
                        </h3>
                        <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0284c7' }}>
                          ₹{tr.cost}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                        {tr.description}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#475569', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                        <Clock size={15} color="#0284c7" /> {tr.duration_minutes} Minutes Session
                      </span>
                      <button
                        onClick={() => scrollToBooking()}
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                      >
                        Book This Session &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. CLINICAL TECHNOLOGY & FACILITIES SHOWCASE */}
      <section id="technology" style={{ padding: '5rem 2rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem', alignItems: 'center' }}>
            <div>
              <span style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Advanced Infrastructure
              </span>
              <h2 style={{ fontSize: '2.3rem', fontWeight: 900, color: '#0f172a', marginTop: '0.4rem', lineHeight: 1.25 }}>
                State-of-the-Art Clinical Rehabilitation Equipment
              </h2>
              <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6, margin: '1rem 0 1.5rem' }}>
                Our clinic is equipped with FDA & CE certified electro-physical modalities to deliver accelerated tissue repair, muscle re-education, and precision spinal decompression.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <Check size={16} />
                  </div>
                  <div>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>Digital Traction & Decompression Units</strong>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0' }}>Graduated axial unloading for lumbar disc prolapse and cervical radiculopathy.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <Check size={16} />
                  </div>
                  <div>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>Class IV High-Intensity Laser Therapy</strong>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0' }}>Deep-penetrating biostimulation for rapid tendon healing and chronic inflammation reduction.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <Check size={16} />
                  </div>
                  <div>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>4-Channel Interferential Therapy (IFT) & Ultrasound</strong>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0' }}>Dual-frequency acoustic waves and targeted currents for deep muscular spasms.</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <img
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80"
                alt="Clinic Treatment Suite"
                style={{ width: '100%', height: '210px', objectFit: 'cover', borderRadius: '1rem', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}
              />
              <img
                src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80"
                alt="Patient Therapy Session"
                style={{ width: '100%', height: '210px', objectFit: 'cover', borderRadius: '1rem', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}
              />
              <img
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80"
                alt="Rehabilitation Gymnasium"
                style={{ width: '100%', height: '210px', objectFit: 'cover', borderRadius: '1rem', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}
              />
              <img
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80"
                alt="Doctor Consultation Room"
                style={{ width: '100%', height: '210px', objectFit: 'cover', borderRadius: '1rem', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. MEET OUR SPECIALIST PHYSIOTHERAPISTS */}
      <section id="doctors" style={{ padding: '5.5rem 2rem', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Expert Medical Team
            </span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0f172a', marginTop: '0.4rem' }}>
              Consult Our Senior Physiotherapists
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '600px', margin: '0.5rem auto 0' }}>
              Our clinicians hold advanced master's degrees in orthopedic rehabilitation, sports physiotherapy, and manual therapy.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '2.5rem' }}>
            {doctors.map((doc) => {
              const photo = doctorImages[doc.id] || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80';
              return (
                <div
                  key={doc.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '1.25rem',
                    border: '1px solid #e2e8f0',
                    padding: '2rem',
                    display: 'flex',
                    gap: '1.75rem',
                    alignItems: 'flex-start',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  }}
                >
                  <img
                    src={photo}
                    alt={doc.name}
                    style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '1rem',
                      objectFit: 'cover',
                      flexShrink: 0,
                      boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{doc.name}</h3>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0284c7' }}>₹{doc.consultation_fee}</span>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>per consultation</div>
                      </div>
                    </div>

                    <div style={{ color: '#0f766e', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.65rem' }}>
                      {doc.specialization_name}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                      {doc.bio}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.78rem', color: '#475569', marginBottom: '1.25rem' }}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '0.25rem 0.65rem', borderRadius: '4px', fontWeight: 600 }}>
                        Reg: <strong>{doc.registration_no}</strong>
                      </span>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '0.25rem 0.65rem', borderRadius: '4px', fontWeight: 600 }}>
                        Exp: <strong>{doc.experience_years} Years</strong>
                      </span>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '0.25rem 0.65rem', borderRadius: '4px', fontWeight: 600 }}>
                        {doc.working_days ? doc.working_days.length : 6} Days/Wk
                      </span>
                    </div>

                    <button
                      onClick={() => scrollToBooking(doc.id)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem' }}
                    >
                      Book with {doc.name.split(' ')[1]} &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE APPOINTMENT BOOKING WIDGET WITH DYNAMIC QR CODE */}
      <section id="booking-section" style={{ padding: '5.5rem 2rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '940px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Online Booking
            </span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0f172a', marginTop: '0.4rem' }}>
              Schedule Your Consultation in 4 Easy Steps
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', margin: '0.5rem auto 0' }}>
              Real-time slot engine ported from Odoo 19: choose your shift, book a time slot, and receive an instant digital QR check-in token.
            </p>
          </div>

          {bookingSuccess ? (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '2px solid #86efac',
              borderRadius: '1.5rem',
              padding: '3rem 2rem',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
            }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <CheckCircle2 size={40} />
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#14532d', marginBottom: '0.5rem' }}>
                Appointment Confirmed!
              </h3>
              <p style={{ color: '#15803d', fontSize: '1rem', marginBottom: '1.25rem' }}>
                Your appointment slip has been registered under reference <strong>{bookingSuccess.appointment_no}</strong> with {bookingSuccess.doctor_name}.
              </p>

              {bookingSuccess.payment_status === 'paid' ? (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#dcfce7',
                  border: '1px solid #86efac',
                  color: '#15803d',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  marginBottom: '1.5rem',
                }}>
                  <CheckCircle2 size={18} />
                  <span>
                    Online Payment Verified: ₹{bookingSuccess.amount_paid || 600} • Receipt #{bookingSuccess.receipt_no || bookingSuccess.payment_ref}
                  </span>
                </div>
              ) : (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#b45309',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  marginBottom: '1.5rem',
                }}>
                  <Clock size={16} />
                  <span>
                    Consultation Fee Payable at Reception Desk During Visit
                  </span>
                </div>
              )}

              {/* REAL GENERATED APPOINTMENT QR CODE */}
              <div style={{
                display: 'inline-block',
                padding: '1.5rem',
                backgroundColor: '#ffffff',
                borderRadius: '1rem',
                border: '2px solid #bbf7d0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                marginBottom: '1.75rem',
              }}>
                <QRCodeSVG
                  value={`PHYSIO:${bookingSuccess.appointment_no}`}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0284c7', marginTop: '0.75rem' }}>
                  TOKEN: {bookingSuccess.appointment_no}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  Show this QR code at clinic reception desk for instant check-in
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setBookingSuccess(null);
                    setPatientName('');
                    setPatientPhone('');
                    setClinicalComplaint('');
                  }}
                  style={{ backgroundColor: '#ffffff' }}
                >
                  Book Another Appointment
                </button>
                <button className="btn btn-primary" onClick={onEnterPortal}>
                  Go to Clinic ERP Portal
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleWebsiteBooking} style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '1.5rem',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: '0 12px 32px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    1. Select Physiotherapist *
                  </label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: '#ffffff', fontWeight: 600 }}
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization_name}) - ₹{d.consultation_fee}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    2. Appointment Date *
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: '#ffffff', fontWeight: 600 }}
                  />
                </div>
              </div>

              {/* Real-time Slots */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  3. Select Shift Time Slot * (Odoo Shift-Based Allocation)
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
                  gap: '0.65rem',
                  maxHeight: '190px',
                  overflowY: 'auto',
                  padding: '0.85rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                }}>
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
                          borderRadius: '0.375rem',
                          fontSize: '0.82rem',
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
                {selectedSlotTime && (
                  <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 700, marginTop: '0.4rem', display: 'block' }}>
                    ✓ Selected Slot: {selectedSlotTime}
                  </span>
                )}
              </div>

              {/* Patient Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="patient@email.com"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Chief Physical Complaint / Pain Symptoms
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. sharp radiating lower back pain down left leg, knee stiffness during stairs"
                  value={clinicalComplaint}
                  onChange={(e) => setClinicalComplaint(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                ></textarea>
              </div>

              {/* Payment Mode Selection */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  4. Payment Preference
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                  <div
                    onClick={() => setPaymentChoice('online')}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: paymentChoice === 'online' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: paymentChoice === 'online' ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentChoice"
                      checked={paymentChoice === 'online'}
                      onChange={() => setPaymentChoice('online')}
                      style={{ cursor: 'pointer', marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>
                          ⚡ Pay Consultation Online (₹{doctors.find((d) => String(d.id) === String(selectedDocId))?.consultation_fee || 600})
                        </strong>
                        <span style={{ backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}>
                          Instant Confirm
                        </span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>
                        Scan UPI QR (GPay, PhonePe, Paytm) or pay via Debit/Credit Cards & NetBanking
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentChoice('clinic')}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: paymentChoice === 'clinic' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: paymentChoice === 'clinic' ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentChoice"
                      checked={paymentChoice === 'clinic'}
                      onChange={() => setPaymentChoice('clinic')}
                      style={{ cursor: 'pointer', marginTop: '3px' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>
                        Pay at Clinic Reception
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>
                        Reserve slot now and pay during your consultation visit via cash, UPI, or card
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ fontSize: '1rem', padding: '0.85rem 2.25rem', borderRadius: '0.5rem' }}
                >
                  {isSubmitting ? 'Confirming Slot...' : 'Confirm Appointment Now'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* 9. PATIENT RECOVERY STORIES & TESTIMONIALS */}
      <section id="reviews" style={{ padding: '5.5rem 2rem', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Verified Patient Outcomes
            </span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0f172a', marginTop: '0.4rem' }}>
              Recovery Stories From Real Patients
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
            <div style={{ padding: '2rem', borderRadius: '1.25rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.25rem', color: '#f59e0b', marginBottom: '1rem' }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#f59e0b" />)}
                </div>
                <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '1.5rem' }}>
                  "I was suffering from excruciating L4-L5 disc sciatica for 6 months. Orthopedic surgeons recommended surgery, but Dr. Arvind's spinal decompression and manual therapy resolved my pain in just 6 weeks!"
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
                  alt="Hitesh Patel"
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>Hitesh Patel</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Treated for Lumbar Disc Herniation</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '2rem', borderRadius: '1.25rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.25rem', color: '#f59e0b', marginBottom: '1rem' }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#f59e0b" />)}
                </div>
                <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '1.5rem' }}>
                  "Post knee replacement surgery, my mobility was very poor and painful. Dr. Meena designed a gentle, progressive rehabilitation regimen that helped me walk independently within 3 weeks. Fantastic facility!"
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
                  alt="Anjali Desai"
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>Anjali Desai</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Post-Total Knee Arthroplasty (TKR)</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '2rem', borderRadius: '1.25rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.25rem', color: '#f59e0b', marginBottom: '1rem' }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#f59e0b" />)}
                </div>
                <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '1.5rem' }}>
                  "As a state badminton player, my shoulder rotator cuff impingement was stopping my career. The Class IV laser therapy combined with rotator cuff strengthening got me back on court pain-free."
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
                  alt="Rahul Mehta"
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>Rahul Mehta</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Athletic Rotator Cuff Rehabilitation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FREQUENTLY ASKED QUESTIONS (ACCORDION) */}
      <section id="faq" style={{ padding: '5rem 2rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clear Answers
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', marginTop: '0.4rem' }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '1rem',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    style={{
                      width: '100%',
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={20} color="#0284c7" /> : <ChevronDown size={20} color="#64748b" />}
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 1.5rem 1.25rem', fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, borderTop: '1px solid #f1f5f9' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. MODAL: ODOO-STYLE BOOKING QR CODE POPUP */}
      {isQrModalOpen && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '1.25rem', width: '100%', maxWidth: '440px', padding: '2rem', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsQrModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#f0fdfa', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <Smartphone size={28} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
              Scan QR to Book on Mobile
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Open your smartphone camera to instantly launch the online booking calendar on your device:
            </p>

            <div style={{ display: 'inline-block', padding: '1.25rem', backgroundColor: '#ffffff', border: '2px solid #0284c7', borderRadius: '1.25rem', boxShadow: '0 8px 24px rgba(2, 132, 199, 0.15)', marginBottom: '1.25rem' }}>
              <QRCodeSVG
                value={bookingUrl}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            <div style={{ fontSize: '0.75rem', color: '#94a3b8', wordBreak: 'break-all', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}>
              {bookingUrl}
            </div>

            <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={() => setIsQrModalOpen(false)}>
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* 12. ONLINE PAYMENT GATEWAY MODAL (UPI / CARDS / NETBANKING) */}
      {isOnlinePayModalOpen && pendingBookingData && (
        <PaymentModal
          isOpen={isOnlinePayModalOpen}
          onClose={() => setIsOnlinePayModalOpen(false)}
          amount={pendingBookingData.consultation_fee || 600}
          appointmentId={pendingBookingData.id}
          patientName={pendingBookingData.patient_name || patientName}
          description={`Consultation with ${pendingBookingData.doctor_name || 'Senior Physiotherapist'}`}
          onPaymentSuccess={handleOnlinePaymentSuccess}
        />
      )}

      {/* 13. PROFESSIONAL HEALTHCARE FOOTER */}
      <footer style={{ backgroundColor: '#0f172a', color: '#cbd5e1', padding: '4.5rem 2.5rem 2.5rem', borderTop: '1px solid #1e293b' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3.5rem', marginBottom: '3.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
                <HeartPulse size={24} />
              </div>
              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff' }}>PhysioCare Clinic</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: '380px', marginBottom: '1.5rem' }}>
              Advanced Healthcare Physical Therapy Management System converted from Odoo 19 ERP to modern React, Node.js, and PostgreSQL.
            </p>
            <button
              onClick={onEnterPortal}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <ShieldCheck size={16} /> Open Clinic ERP Portal &rarr;
            </button>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Clinical Specialties
            </h4>
            <ul style={{ listStyle: 'none', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li>Manual Joint Mobilization</li>
              <li>Spinal Traction & Decompression</li>
              <li>Electrotherapy & Ultrasound</li>
              <li>Class IV Laser Biostimulation</li>
              <li>Sports Injury & ACL Rehab</li>
              <li>Post-Surgical Joint Care</li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Navigation
            </h4>
            <ul style={{ listStyle: 'none', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li><a href="#services" style={{ color: '#94a3b8', textDecoration: 'none' }}>Treatments Catalog</a></li>
              <li><a href="#doctors" style={{ color: '#94a3b8', textDecoration: 'none' }}>Specialist Doctors</a></li>
              <li><a href="#technology" style={{ color: '#94a3b8', textDecoration: 'none' }}>Clinical Technology</a></li>
              <li><a href="#booking-section" style={{ color: '#94a3b8', textDecoration: 'none' }}>Book Online Slot</a></li>
              <li><a href="#reviews" style={{ color: '#94a3b8', textDecoration: 'none' }}>Patient Reviews</a></li>
              <li><span onClick={onEnterPortal} style={{ cursor: 'pointer', color: '#38bdf8', fontWeight: 600 }}>Staff ERP Login</span></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Clinic Desk & Location
            </h4>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <MapPin size={18} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>402 Medical Arts Plaza, CG Road, Ahmedabad, Gujarat, India</span>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <Phone size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
                <span>+91 99000 11000 / +91 91234 56789</span>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <Clock size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
                <span>Morning (8-12) • Afternoon (1-5) • Evening (5:30-9)</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
          <div>© 2026 PhysioCare Physical Therapy Management System. Converted from Odoo 19 Healthcare Module.</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Privacy Policy</span>
            <span>Terms of Clinical Service</span>
            <span>Patient Rights Charter</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
