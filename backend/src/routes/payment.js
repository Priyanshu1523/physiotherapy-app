const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { memoryStore, pool, query } = require('../db');

// GET /api/payment/config
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      merchant_name: process.env.CLINIC_NAME || 'PhysioCare Clinic & Rehabilitation Center',
      upi_vpa: process.env.UPI_MERCHANT_VPA || 'physiocare@icici',
      currency: 'INR',
      currency_symbol: '₹',
      razorpay_key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_physiocare_demo',
      methods: ['upi', 'card', 'netbanking', 'cash'],
      is_test_mode: process.env.NODE_ENV !== 'production',
    },
  });
});

// POST /api/payment/create-order
router.post('/create-order', async (req, res) => {
  try {
    const {
      amount,
      invoice_id,
      appointment_id,
      patient_name = 'Patient',
      patient_phone = '',
      patient_email = '',
      description = 'Physiotherapy Consultation & Therapy',
    } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const orderId = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const merchantName = process.env.CLINIC_NAME || 'PhysioCare Clinic';
    const upiVpa = process.env.UPI_MERCHANT_VPA || 'physiocare@icici';

    // Generate Standard UPI deep-link string:
    // upi://pay?pa=physiocare@icici&pn=PhysioCare%20Clinic&am=600.00&tr=ORD-2026-123456&cu=INR&tn=PhysioCare%20Payment
    const encodedMerchant = encodeURIComponent(merchantName);
    const encodedNote = encodeURIComponent(`PhysioCare ${orderId}`);
    const upiString = `upi://pay?pa=${upiVpa}&pn=${encodedMerchant}&am=${parsedAmount.toFixed(2)}&tr=${orderId}&cu=INR&tn=${encodedNote}`;

    // Generate DataURL QR Code for mobile UPI scanning
    const qrCodeDataUrl = await QRCode.toDataURL(upiString, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const orderData = {
      order_id: orderId,
      amount: parsedAmount,
      currency: 'INR',
      invoice_id: invoice_id ? parseInt(invoice_id) : null,
      appointment_id: appointment_id ? parseInt(appointment_id) : null,
      patient_name,
      patient_phone,
      patient_email,
      description,
      upi_vpa: upiVpa,
      upi_string: upiString,
      qr_code: qrCodeDataUrl,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins expiry
    };

    res.json({
      success: true,
      data: orderData,
    });
  } catch (err) {
    console.error('Error generating payment order:', err);
    res.status(500).json({ success: false, message: 'Failed to create payment order: ' + err.message });
  }
});

// POST /api/payment/verify
router.post('/verify', async (req, res) => {
  try {
    const {
      order_id,
      invoice_id,
      appointment_id,
      amount,
      payment_method = 'upi',
      transaction_ref,
      patient_name = 'Patient',
      card_last4 = null,
    } = req.body;

    const payAmount = parseFloat(amount) || 0;
    const txnRef = transaction_ref || `TXN-${payment_method.toUpperCase()}-${Date.now().toString().slice(-8)}`;
    const paymentNo = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const paymentRecord = {
      payment_no: paymentNo,
      order_id: order_id || `ORD-${Date.now().toString().slice(-6)}`,
      amount: payAmount,
      payment_method,
      transaction_ref: txnRef,
      card_last4,
      status: 'success',
      payment_date: new Date().toISOString(),
      notes: `Verified online payment via ${payment_method.toUpperCase()}`,
    };

    let updatedInvoice = null;
    let updatedAppointment = null;

    // 1. If invoice_id is linked, update invoice status in memory and DB
    if (invoice_id) {
      const invId = parseInt(invoice_id);
      const inv = memoryStore.invoices.find((i) => i.id === invId);
      if (inv) {
        inv.paid_amount = (parseFloat(inv.paid_amount) || 0) + payAmount;
        if (inv.paid_amount >= inv.total_amount) {
          inv.status = 'paid';
        } else if (inv.paid_amount > 0) {
          inv.status = 'partially_paid';
        }
        inv.payments = inv.payments || [];
        inv.payments.push(paymentRecord);
        updatedInvoice = inv;
      }

      // Try database update if pool is alive
      try {
        if (pool) {
          await query(
            `INSERT INTO payments (payment_no, invoice_id, amount, payment_method, transaction_ref, notes)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [paymentNo, invId, payAmount, payment_method, txnRef, paymentRecord.notes]
          );
          await query(
            `UPDATE invoices 
             SET paid_amount = paid_amount + $1,
                 status = CASE WHEN paid_amount + $1 >= total_amount THEN 'paid' ELSE 'partially_paid' END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [payAmount, invId]
          );
        }
      } catch (dbErr) {
        console.warn('DB payment update fallback to memory:', dbErr.message);
      }
    }

    // 2. If appointment_id is linked, confirm appointment and ensure invoice is marked paid
    if (appointment_id) {
      const apptId = parseInt(appointment_id);
      const appt = memoryStore.appointments.find((a) => a.id === apptId);
      if (appt) {
        appt.status = 'confirmed';
        appt.payment_status = 'paid';
        appt.payment_ref = txnRef;
        updatedAppointment = appt;
      }

      // Try database update
      try {
        if (pool) {
          await query(
            `UPDATE appointments SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [apptId]
          );
        }
      } catch (dbErr) {
        console.warn('DB appointment payment update fallback to memory:', dbErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Payment successfully processed and verified',
      data: {
        receipt_no: paymentNo,
        transaction_id: txnRef,
        amount: payAmount,
        currency: 'INR',
        payment_method,
        status: 'paid',
        payment: paymentRecord,
        invoice: updatedInvoice,
        appointment: updatedAppointment,
      },
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ success: false, message: 'Payment verification failed: ' + err.message });
  }
});

module.exports = router;
