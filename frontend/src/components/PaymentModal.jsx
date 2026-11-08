import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Building,
  Banknote,
  ShieldCheck,
  Printer,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api';

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  invoiceId = null,
  appointmentId = null,
  patientName = 'Patient',
  description = 'Physiotherapy Consultation & Treatment',
  onPaymentSuccess,
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'cash'
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  // UPI State
  const [utrNumber, setUtrNumber] = useState('');

  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState(patientName !== 'Patient' ? patientName : '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // NetBanking State
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Cash State
  const [cashTendered, setCashTendered] = useState(amount || '');
  const [cashNotes, setCashNotes] = useState('Received at clinic reception desk');

  // Timer countdown
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins

  useEffect(() => {
    let timer;
    if (isOpen && !paymentSuccess) {
      initOrder();
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen]);

  const initOrder = async () => {
    try {
      setLoading(true);
      const res = await api.createPaymentOrder({
        amount: parseFloat(amount),
        invoice_id: invoiceId,
        appointment_id: appointmentId,
        patient_name: patientName,
        description,
      });
      if (res && res.success) {
        setOrderData(res.data);
      }
    } catch (err) {
      console.error('Error creating payment order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyVpa = (vpa) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(vpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCardNumber = (val) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.substring(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  const formatExpiry = (val) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 4);
    if (cleaned.length >= 3) {
      setCardExpiry(`${cleaned.substring(0, 2)}/${cleaned.substring(2)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  const executePayment = async (method, details = {}) => {
    setLoading(true);
    try {
      const payload = {
        order_id: orderData?.order_id || `ORD-${Date.now().toString().slice(-6)}`,
        invoice_id: invoiceId,
        appointment_id: appointmentId,
        amount: parseFloat(amount),
        payment_method: method,
        patient_name: patientName,
        transaction_ref: details.transaction_ref || `TXN-${method.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
        card_last4: details.card_last4 || null,
      };

      const res = await api.verifyPayment(payload);
      if (res && res.success) {
        setPaymentSuccess(res.data);
        if (onPaymentSuccess) {
          onPaymentSuccess(res.data);
        }
      } else {
        alert('Payment verification failed. Please try again.');
      }
    } catch (err) {
      alert('Payment processing error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpiSubmit = (e) => {
    e.preventDefault();
    executePayment('upi', {
      transaction_ref: utrNumber || `UPI-APP-${Date.now().toString().slice(-6)}`,
    });
  };

  const handleCardSubmit = (e) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 16) {
      alert('Please enter a valid 16-digit card number');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      alert('Please enter card expiry as MM/YY');
      return;
    }
    if (cardCvv.length < 3) {
      alert('Please enter a 3-digit CVV');
      return;
    }

    const last4 = cardNumber.replace(/\s/g, '').slice(-4);
    executePayment('card', {
      transaction_ref: `CRD-${Date.now().toString().slice(-8)}`,
      card_last4: last4,
    });
  };

  const handleNetBankingSubmit = (e) => {
    e.preventDefault();
    executePayment('online', {
      transaction_ref: `NB-${selectedBank}-${Date.now().toString().slice(-6)}`,
    });
  };

  const handleCashSubmit = (e) => {
    e.preventDefault();
    executePayment('cash', {
      transaction_ref: `CASH-REC-${Date.now().toString().slice(-6)}`,
    });
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const upiVpa = orderData?.upi_vpa || 'physiocare@icici';
  const upiQrString = orderData?.upi_string || `upi://pay?pa=${upiVpa}&pn=PhysioCare%20Clinic&am=${amount}&cu=INR`;

  return (
    <div className="modal-overlay" style={{ zIndex: 1200, padding: '1.25rem' }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '1.25rem',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        animation: 'fadeIn 0.2s ease',
      }}>
        {/* MODAL HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '1.5rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <ShieldCheck size={16} /> 256-Bit SSL Encrypted Payment
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0 0', color: '#ffffff' }}>
              PhysioCare Checkout
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* AMOUNT & PATIENT BANNER */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '1.1rem 1.75rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>
              Patient / Billed To
            </span>
            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{patientName}</strong>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>{description}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>
              Total Payable
            </span>
            <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0284c7' }}>
              ₹{parseFloat(amount).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* PAYMENT SUCCESS VIEW */}
        {paymentSuccess ? (
          <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <CheckCircle2 size={44} />
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              Payment Successful!
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              Thank you! Your payment of <strong>₹{paymentSuccess.amount}</strong> has been verified.
            </p>

            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              textAlign: 'left',
              marginBottom: '1.75rem',
              fontSize: '0.85rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Receipt Number:</span>
                <strong>{paymentSuccess.receipt_no}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Transaction ID:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                  {paymentSuccess.transaction_id}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Payment Method:</span>
                <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  {paymentSuccess.payment_method}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Status:</span>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>VERIFIED & PAID</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
                style={{ padding: '0.65rem 1.5rem' }}
              >
                Done / Back to Clinic
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* PAYMENT TABS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
            }}>
              {[
                { id: 'upi', label: 'UPI QR', icon: <QrCode size={16} /> },
                { id: 'card', label: 'Cards', icon: <CreditCard size={16} /> },
                { id: 'netbanking', label: 'NetBank', icon: <Building size={16} /> },
                { id: 'cash', label: 'Cash Desk', icon: <Banknote size={16} /> },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.85rem 0.5rem',
                      background: isActive ? '#ffffff' : 'transparent',
                      border: 'none',
                      borderBottom: isActive ? '3px solid #0284c7' : '3px solid transparent',
                      color: isActive ? '#0284c7' : '#64748b',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT BODY */}
            <div style={{ padding: '1.75rem' }}>
              {/* TAB 1: UPI DYNAMIC QR */}
              {activeTab === 'upi' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginBottom: '1rem',
                  }}>
                    <Clock size={14} /> Scan with Google Pay, PhonePe, Paytm, or BHIM ({formatTimer(timeLeft)})
                  </div>

                  {/* QR Code Container */}
                  <div style={{
                    display: 'inline-block',
                    padding: '1rem',
                    backgroundColor: '#ffffff',
                    border: '2px dashed #0284c7',
                    borderRadius: '1rem',
                    boxShadow: '0 8px 24px rgba(2, 132, 199, 0.1)',
                    marginBottom: '1rem',
                  }}>
                    {orderData?.qr_code ? (
                      <img
                        src={orderData.qr_code}
                        alt="UPI Payment QR Code"
                        style={{ width: '190px', height: '190px', display: 'block' }}
                      />
                    ) : (
                      <QRCodeSVG
                        value={upiQrString}
                        size={190}
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                        level="M"
                      />
                    )}
                  </div>

                  {/* VPA Details */}
                  <div style={{
                    backgroundColor: '#f1f5f9',
                    padding: '0.65rem 1rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    maxWidth: '340px',
                    margin: '0 auto 1.25rem',
                    fontSize: '0.85rem',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>UPI ID (VPA):</span>
                      <strong style={{ color: '#0f172a' }}>{upiVpa}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyVpa(upiVpa)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '0.375rem',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        color: copied ? '#16a34a' : '#475569',
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  {/* Instant Confirm simulation button */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '360px', margin: '0 auto' }}>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => executePayment('upi', { transaction_ref: `UPI-${Date.now().toString().slice(-8)}` })}
                      disabled={loading}
                      style={{
                        padding: '0.75rem',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
                      }}
                    >
                      <Sparkles size={16} />
                      {loading ? 'Verifying Payment...' : `Simulate Instant UPI Payment (₹${amount})`}
                    </button>

                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Or enter UTR/Reference number from your banking app:
                    </div>

                    <form onSubmit={handleUpiSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="e.g. 408221998811"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.85rem',
                        }}
                      />
                      <button
                        type="submit"
                        className="btn btn-outline"
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
                      >
                        Verify
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 2: CREDIT / DEBIT CARD */}
              {activeTab === 'card' && (
                <form onSubmit={handleCardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Visual Card representation */}
                  <div style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    borderRadius: '1rem',
                    padding: '1.25rem 1.5rem',
                    color: '#ffffff',
                    boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.4)',
                    marginBottom: '0.5rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <span style={{ fontSize: '0.8rem', letterSpacing: '0.1em', opacity: 0.85 }}>PHYSIOCARE MEDICAL PAY</span>
                      <CreditCard size={24} />
                    </div>
                    <div style={{ fontSize: '1.25rem', letterSpacing: '0.15em', fontFamily: 'monospace', marginBottom: '1.25rem' }}>
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem' }}>
                      <div>
                        <span style={{ opacity: 0.7, display: 'block' }}>CARDHOLDER</span>
                        <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>{cardName || 'PATIENT NAME'}</strong>
                      </div>
                      <div>
                        <span style={{ opacity: 0.7, display: 'block' }}>EXPIRES</span>
                        <strong style={{ fontSize: '0.85rem' }}>{cardExpiry || 'MM/YY'}</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                      Card Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="4532 8920 1234 5678"
                      value={cardNumber}
                      onChange={(e) => formatCardNumber(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                        Cardholder Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Name on card"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                          Expiry *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => formatExpiry(e.target.value)}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                          CVV *
                        </label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{
                      padding: '0.85rem',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      marginTop: '0.5rem',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                    }}
                  >
                    {loading ? 'Processing via Gateway...' : `Authorize & Pay ₹${parseFloat(amount).toLocaleString('en-IN')}`}
                  </button>
                </form>
              )}

              {/* TAB 3: NETBANKING */}
              {activeTab === 'netbanking' && (
                <form onSubmit={handleNetBankingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                      Popular Banks:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      {['HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak', 'PNB'].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          style={{
                            padding: '0.65rem',
                            border: selectedBank === bank ? '2px solid #0284c7' : '1px solid #cbd5e1',
                            borderRadius: '0.375rem',
                            background: selectedBank === bank ? '#e0f2fe' : '#ffffff',
                            color: selectedBank === bank ? '#0284c7' : '#334155',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          {bank} Bank
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                    You will be redirected to {selectedBank} Bank NetBanking portal to authenticate payment.
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ padding: '0.85rem', fontWeight: 700 }}
                  >
                    {loading ? 'Connecting to Bank...' : `Proceed to ${selectedBank} Bank (₹${amount})`}
                  </button>
                </form>
              )}

              {/* TAB 4: CASH COUNTER (RECEPTION) */}
              {activeTab === 'cash' && (
                <form onSubmit={handleCashSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.85rem', borderRadius: '0.5rem', color: '#065f46', fontSize: '0.85rem' }}>
                    <strong>Clinic Reception Cashiering</strong>: Record physical cash payment received directly from the patient.
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                      Cash Tendered by Patient (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                    />
                  </div>

                  {parseFloat(cashTendered) > parseFloat(amount) && (
                    <div style={{ backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #bbf7d0', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Change to Return to Patient:</span>
                      <strong style={{ color: '#16a34a', fontSize: '1rem' }}>
                        ₹{(parseFloat(cashTendered) - parseFloat(amount)).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                      Cashier Notes
                    </label>
                    <input
                      type="text"
                      value={cashNotes}
                      onChange={(e) => setCashNotes(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={loading}
                    style={{ padding: '0.85rem', fontWeight: 700, fontSize: '0.95rem' }}
                  >
                    {loading ? 'Recording Cash...' : `Collect ₹${amount} & Mark Paid`}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
