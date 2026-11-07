const express = require('express');
const router = express.Router();
const { memoryStore } = require('../db');

// GET /api/billing/invoices
router.get('/invoices', (req, res) => {
  const { status, patient_id } = req.query;
  let result = [...memoryStore.invoices];

  if (status) {
    result = result.filter((i) => i.status === status);
  }
  if (patient_id) {
    result = result.filter((i) => i.patient_id === parseInt(patient_id));
  }

  res.json({ success: true, data: result });
});

// GET /api/billing/invoices/:id
router.get('/invoices/:id', (req, res) => {
  const invId = parseInt(req.params.id);
  const invoice = memoryStore.invoices.find((i) => i.id === invId);

  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }

  const patient = memoryStore.patients.find((p) => p.id === invoice.patient_id);
  const doctor = memoryStore.doctors.find((d) => d.id === invoice.doctor_id);

  res.json({
    success: true,
    data: {
      ...invoice,
      patient,
      doctor,
    },
  });
});

// POST /api/billing/invoices
router.post('/invoices', (req, res) => {
  const {
    appointment_id,
    patient_id,
    doctor_id,
    lines = [],
    discount = 0,
    tax = 0,
    notes = '',
  } = req.body;

  const nextId = memoryStore.invoices.length + 1;
  const year = new Date().getFullYear();
  const invoiceNo = `INV-${year}-${String(nextId).padStart(3, '0')}`;

  const patient = memoryStore.patients.find((p) => p.id === parseInt(patient_id));
  const doctor = memoryStore.doctors.find((d) => d.id === parseInt(doctor_id));

  let subtotal = 0;
  const formattedLines = lines.map((l) => {
    const qty = parseInt(l.quantity) || 1;
    const price = parseFloat(l.unit_price) || 0;
    const total = qty * price;
    subtotal += total;
    return {
      description: l.description,
      quantity: qty,
      unit_price: price,
      total_price: total,
    };
  });

  const disc = parseFloat(discount) || 0;
  const tx = parseFloat(tax) || 0;
  const totalAmount = subtotal + tx - disc;

  const newInvoice = {
    id: nextId,
    invoice_no: invoiceNo,
    appointment_id: appointment_id ? parseInt(appointment_id) : null,
    prescription_id: null,
    patient_id: patient ? patient.id : 1,
    patient_name: patient ? patient.name : 'Patient',
    doctor_id: doctor ? doctor.id : null,
    doctor_name: doctor ? doctor.name : null,
    subtotal,
    tax: tx,
    discount: disc,
    total_amount: totalAmount,
    paid_amount: 0.0,
    status: 'unpaid',
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0],
    notes,
    lines: formattedLines,
    payments: [],
    created_at: new Date().toISOString(),
  };

  memoryStore.invoices.unshift(newInvoice);
  res.status(201).json({ success: true, data: newInvoice });
});

// POST /api/billing/invoices/:id/pay
router.post('/invoices/:id/pay', (req, res) => {
  const invId = parseInt(req.params.id);
  const invoice = memoryStore.invoices.find((i) => i.id === invId);

  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }

  const { amount, payment_method = 'cash', transaction_ref = '', notes = '' } = req.body;
  const payAmt = parseFloat(amount) || (invoice.total_amount - invoice.paid_amount);

  const paymentNo = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const paymentRecord = {
    payment_no: paymentNo,
    amount: payAmt,
    payment_method,
    transaction_ref: transaction_ref || `REF-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString(),
    notes,
  };

  invoice.payments.push(paymentRecord);
  invoice.paid_amount += payAmt;

  if (invoice.paid_amount >= invoice.total_amount) {
    invoice.status = 'paid';
  } else if (invoice.paid_amount > 0) {
    invoice.status = 'partially_paid';
  }

  res.json({
    success: true,
    data: {
      invoice,
      payment: paymentRecord,
    },
  });
});

module.exports = router;
