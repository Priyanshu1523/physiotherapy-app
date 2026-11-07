import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Receipt, Plus, Printer, CheckCircle, IndianRupee, CreditCard } from 'lucide-react';

export default function BillingView() {
  const [invoices, setInvoices] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activePrintInv, setActivePrintInv] = useState(null);

  // Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [transactionRef, setTransactionRef] = useState('');

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoices(statusFilter ? { status: statusFilter } : {});
      if (res.success) setInvoices(res.data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const openPayModal = (inv) => {
    setSelectedInvoice(inv);
    setPayAmount(String(inv.total_amount - inv.paid_amount));
    setTransactionRef('');
    setIsPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.payInvoice(selectedInvoice.id, {
        amount: parseFloat(payAmount),
        payment_method: paymentMethod,
        transaction_ref: transactionRef,
      });

      if (res.success) {
        setIsPayModalOpen(false);
        loadInvoices();
      }
    } catch (err) {
      alert('Payment failed: ' + err.message);
    }
  };

  const openPrintModal = (inv) => {
    setActivePrintInv(inv);
    setIsPrintModalOpen(true);
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Billing, Invoicing & Payments</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Generate GST compliant invoices for consultations, therapies, and record instant receipts</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['', 'unpaid', 'partially_paid', 'paid'].map((st) => (
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
              {st === '' ? 'All Invoices' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="clinic-table">
          <thead>
            <tr>
              <th>Invoice No.</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Total Amount</th>
              <th>Paid Amount</th>
              <th>Balance Due</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const balance = inv.total_amount - inv.paid_amount;
                return (
                  <tr key={inv.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0284c7' }}>{inv.invoice_no}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.patient_name}</div>
                    </td>
                    <td>{inv.doctor_name || 'Clinic Service'}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>₹{inv.total_amount}</td>
                    <td style={{ fontWeight: 600, color: '#16a34a' }}>₹{inv.paid_amount}</td>
                    <td style={{ fontWeight: 700, color: balance > 0 ? '#dc2626' : '#64748b' }}>
                      ₹{balance}
                    </td>
                    <td>
                      <span className={`badge badge-${inv.status}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        {inv.status !== 'paid' && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => openPayModal(inv)}
                          >
                            <CreditCard size={14} /> Pay
                          </button>
                        )}
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={() => openPrintModal(inv)}
                        >
                          <Printer size={14} /> Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {isPayModalOpen && selectedInvoice && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '100%', maxWidth: '480px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Record Payment</h3>
              <button onClick={() => setIsPayModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: '#64748b' }}>Invoice:</span>
                <strong>{selectedInvoice.invoice_no}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: '#64748b' }}>Patient:</span>
                <strong>{selectedInvoice.patient_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Pending Due:</span>
                <strong style={{ color: '#dc2626' }}>₹{selectedInvoice.total_amount - selectedInvoice.paid_amount}</strong>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="cash">Cash Counter</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="online">Net Banking</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Transaction / UPI Reference No.</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-99882211"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsPayModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT INVOICE RECEIPT MODAL */}
      {isPrintModalOpen && activePrintInv && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '100%', maxWidth: '600px', padding: '2rem' }}>
            <div className="printable-area" style={{ border: '1px solid #cbd5e1', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>PhysioCare Advanced Rehabilitation</h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>GSTIN: 24AAACP1234F1Z5 • Clinic License: PHY/2026/8891</p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Ahmedabad, Gujarat • Phone: +91 99000 11000</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7' }}>TAX INVOICE</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{activePrintInv.invoice_no}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Billed To:</span>
                  <div style={{ fontWeight: 700 }}>{activePrintInv.patient_name}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Attending Doctor:</span>
                  <div style={{ fontWeight: 600 }}>{activePrintInv.doctor_name || 'Consultant'}</div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Service Description</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Rate (₹)</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(activePrintInv.lines || []).map((l, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem' }}>{l.description}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>{l.quantity}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>₹{l.unit_price}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>₹{l.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.85rem' }}>
                <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <strong>₹{activePrintInv.subtotal}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tax (GST):</span>
                    <span>₹{activePrintInv.tax || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '0.35rem', fontSize: '1rem' }}>
                    <span style={{ fontWeight: 800 }}>Total:</span>
                    <strong style={{ color: '#0284c7' }}>₹{activePrintInv.total_amount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                    <span>Paid Amount:</span>
                    <strong>₹{activePrintInv.paid_amount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>Balance Due:</span>
                    <strong>₹{activePrintInv.total_amount - activePrintInv.paid_amount}</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem', color: '#64748b' }}>
                <div>
                  <p>Thank you for choosing PhysioCare!</p>
                  <p>Computer generated invoice, no physical signature required.</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '130px', borderBottom: '1px solid #64748b', marginBottom: '0.25rem' }}></div>
                  <span>Authorized Cashier</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }} className="no-print">
              <button className="btn btn-outline" onClick={() => setIsPrintModalOpen(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print Official Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
