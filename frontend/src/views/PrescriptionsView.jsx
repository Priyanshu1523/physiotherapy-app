import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  FileText,
  Plus,
  Printer,
  Trash2,
  Pill,
  Activity,
  User,
  Stethoscope,
  Eye,
  CheckCircle2,
  Receipt,
  Calendar,
  AlertCircle,
  Clock,
} from 'lucide-react';

export default function PrescriptionsView({ currentUser }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [frequencies, setFrequencies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeSlip, setActiveSlip] = useState(null);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [viewingDetailPrescription, setViewingDetailPrescription] = useState(null);

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicineLines, setMedicineLines] = useState([
    { medicine_name: 'Thiocolchicoside + Aceclofenac', dosage: '100mg + 4mg', frequency: '1-0-1', days: 7, instructions: 'After meals' },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prRes, patRes, docRes, trRes, medRes, freqRes] = await Promise.all([
        api.getPrescriptions(),
        api.getPatients(),
        api.getDoctors(),
        api.getTreatments(),
        api.getMedicines(),
        api.getFrequencies(),
      ]);

      if (prRes.success && prRes.data) setPrescriptions(prRes.data);
      if (patRes.success && patRes.data) {
        setPatients(patRes.data);
        if (patRes.data.length > 0 && !selectedPatientId) setSelectedPatientId(patRes.data[0].id);
      }
      if (docRes.success && docRes.data) {
        setDoctors(docRes.data);
        if (docRes.data.length > 0 && !selectedDoctorId) setSelectedDoctorId(docRes.data[0].id);
      }
      if (trRes.success && trRes.data) {
        setTreatments(trRes.data);
        if (trRes.data.length > 0 && !selectedTreatmentId) setSelectedTreatmentId(trRes.data[0].id);
      }
      if (medRes.success && medRes.data) setMedicines(medRes.data);
      if (freqRes.success && freqRes.data) setFrequencies(freqRes.data);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicineRow = () => {
    const defaultMed = medicines.length > 0 ? medicines[0] : null;
    setMedicineLines([
      ...medicineLines,
      {
        medicine_name: defaultMed ? defaultMed.name : '',
        dosage: defaultMed ? defaultMed.dosage : '500mg',
        frequency: '1-0-1',
        days: 7,
        instructions: 'After meals with water',
      },
    ]);
  };

  const handleRemoveMedicineRow = (index) => {
    if (medicineLines.length === 1) return;
    setMedicineLines(medicineLines.filter((_, idx) => idx !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicineLines];
    updated[index][field] = value;

    // Auto-fill dosage if medicine name is selected from catalog
    if (field === 'medicine_name') {
      const match = medicines.find((m) => m.name === value);
      if (match) {
        updated[index].dosage = match.dosage;
      }
    }

    setMedicineLines(updated);
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createPrescription({
        patient_id: selectedPatientId,
        doctor_id: selectedDoctorId,
        treatment_id: selectedTreatmentId,
        diagnosis,
        notes,
        medicines: medicineLines,
      });

      if (res.success) {
        setIsAddModalOpen(false);
        setDiagnosis('');
        setNotes('');
        setMedicineLines([
          { medicine_name: 'Thiocolchicoside + Aceclofenac', dosage: '100mg + 4mg', frequency: '1-0-1', days: 7, instructions: 'After meals' },
        ]);
        loadData();
      }
    } catch (err) {
      alert('Error creating prescription: ' + err.message);
    }
  };

  const openSlip = (pr) => {
    setActiveSlip(pr);
    setIsSlipOpen(true);
  };

  const handleCreateInvoiceFromRx = async (pr) => {
    try {
      const treatment = treatments.find((t) => t.name === pr.treatment_name) || { cost: 600 };
      const res = await api.createInvoice({
        patient_id: pr.patient_id,
        patient_name: pr.patient_name,
        doctor_id: pr.doctor_id,
        doctor_name: pr.doctor_name,
        prescription_id: pr.id,
        subtotal: treatment.cost,
        tax: 0,
        total_amount: treatment.cost,
        status: 'unpaid',
        notes: `Invoice for Prescription ${pr.sequence_no} (${pr.diagnosis})`,
        lines: [
          { description: `Prescribed Therapy - ${pr.treatment_name || 'Therapy Session'}`, quantity: 1, unit_price: treatment.cost, total_price: treatment.cost },
        ],
      });

      if (res.success) {
        alert(`✓ Invoice successfully created for Prescription ${pr.sequence_no}! Check Billing & Invoices tab.`);
        pr.status = 'invoiced';
        setPrescriptions([...prescriptions]);
      }
    } catch (err) {
      alert('Error creating invoice: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={22} color="#0284c7" /> Clinical Prescriptions & Medication Plans (Rx)
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Ported from Odoo 19 <code>medical.prescription</code>: Medical prescriptions issued after consultation, complete with medicines, dosages, frequencies and advice.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> Write New Prescription
        </button>
      </div>

      {/* Prescriptions Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="clinic-table">
          <thead>
            <tr>
              <th>Rx Number</th>
              <th>Date</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Primary Clinical Diagnosis</th>
              <th>Prescribed Modality</th>
              <th>Medicines Count</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading prescriptions...
                </td>
              </tr>
            ) : prescriptions.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  No prescriptions found.
                </td>
              </tr>
            ) : (
              prescriptions.map((pr) => (
                <tr key={pr.id}>
                  <td>
                    <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.9rem' }}>{pr.sequence_no}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>{pr.prescription_date}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{pr.patient_name}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>{pr.doctor_name}</div>
                  </td>
                  <td style={{ maxWidth: '240px' }}>
                    <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>{pr.diagnosis}</div>
                  </td>
                  <td>
                    <span style={{ backgroundColor: '#f0fdf4', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                      {pr.treatment_name || 'Manual Therapy'}
                    </span>
                  </td>
                  <td>
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                      {pr.medicines?.length || 0} Meds
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-done" style={{ textTransform: 'capitalize' }}>
                      {pr.status || 'prescribed'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={() => setViewingDetailPrescription(pr)}
                      >
                        <Eye size={13} /> View Full Rx
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={() => openSlip(pr)}
                      >
                        <Printer size={13} /> Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW FULL PRESCRIPTION DETAIL MODAL (Odoo Form View Parity) */}
      {viewingDetailPrescription && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', width: '100%', maxWidth: '780px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            {/* Top Bar with Odoo Workflow Ribbon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Odoo 19 Medical Prescription</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{viewingDetailPrescription.sequence_no}</h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  backgroundColor: viewingDetailPrescription.status === 'invoiced' ? '#f0fdf4' : '#e0f2fe',
                  color: viewingDetailPrescription.status === 'invoiced' ? '#15803d' : '#0369a1',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                }}>
                  ● {viewingDetailPrescription.status}
                </span>
                <button onClick={() => setViewingDetailPrescription(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#64748b' }}>✕</button>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  openSlip(viewingDetailPrescription);
                }}
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
              >
                <Printer size={15} /> Print Rx Slip
              </button>

              {viewingDetailPrescription.status !== 'invoiced' && (
                <button
                  className="btn btn-outline"
                  onClick={() => handleCreateInvoiceFromRx(viewingDetailPrescription)}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                >
                  <Receipt size={15} /> Create Invoice / Bill
                </button>
              )}
            </div>

            {/* Meta Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Patient Information</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{viewingDetailPrescription.patient_name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>Date Issued: {viewingDetailPrescription.prescription_date}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Prescribing Clinician</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{viewingDetailPrescription.doctor_name}</div>
                <div style={{ fontSize: '0.8rem', color: '#0f766e', fontWeight: 700, marginTop: '2px' }}>Senior Physiotherapist</div>
              </div>

              <div style={{ gridColumn: 'span 2', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Clinical Diagnosis</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                  {viewingDetailPrescription.diagnosis}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Assigned Physical Therapy Modality</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                  <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.85rem', fontWeight: 800, padding: '0.25rem 0.75rem', borderRadius: '6px' }}>
                    {viewingDetailPrescription.treatment_name || 'Manual Therapy'}
                  </span>
                </div>
              </div>
            </div>

            {/* Prescribed Medicines Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Pill size={16} color="#0284c7" /> Prescribed Medications & Dosage Instructions
              </h4>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Medicine Name</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Dosage</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Frequency</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Duration</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingDetailPrescription.medicines?.map((med, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#0f172a' }}>{med.medicine_name}</td>
                        <td style={{ padding: '0.65rem 0.85rem', color: '#475569' }}>{med.dosage}</td>
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                            {med.frequency}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>{med.days} Days</td>
                        <td style={{ padding: '0.65rem 0.85rem', color: '#64748b' }}>{med.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes & Clinical Advice */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Physiotherapy Advice & Precautions</span>
              <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, margin: '4px 0 0' }}>
                {viewingDetailPrescription.notes || 'Gentle mobility exercises 3x daily. Avoid acute spinal flexion.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setViewingDetailPrescription(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PRESCRIPTION MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', width: '100%', maxWidth: '760px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Issue Medical Prescription (Rx)</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <form onSubmit={handleCreatePrescription} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Patient *</label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontWeight: 600 }}
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.patient_code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Prescribing Doctor *</label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontWeight: 600 }}
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.specialization_name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Prescribed Physical Therapy Modality</label>
                  <select
                    value={selectedTreatmentId}
                    onChange={(e) => setSelectedTreatmentId(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontWeight: 600 }}
                  >
                    {treatments.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} (₹{t.cost})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Primary Clinical Diagnosis *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lumbar Spondylolisthesis with L5 radiculopathy"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* Dynamic Medicine Lines Table */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Prescribed Medications & Formulations</label>
                  <button type="button" onClick={handleAddMedicineRow} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                    <Plus size={14} /> Add Medicine Line
                  </button>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  {medicineLines.map((line, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3.5fr 2fr 2fr 1.5fr 3fr 30px', gap: '0.5rem', padding: '0.6rem', borderBottom: '1px solid #f1f5f9', alignItems: 'center', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      {/* Pick from Medicines Catalog or Custom Input */}
                      <input
                        type="text"
                        list={`med-list-${idx}`}
                        placeholder="Medicine name"
                        value={line.medicine_name}
                        onChange={(e) => handleMedicineChange(idx, 'medicine_name', e.target.value)}
                        required
                        style={{ padding: '0.4rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                      <datalist id={`med-list-${idx}`}>
                        {medicines.map((m) => (
                          <option key={m.id} value={m.name} />
                        ))}
                      </datalist>

                      <input
                        type="text"
                        placeholder="Dosage (100mg)"
                        value={line.dosage}
                        onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                        style={{ padding: '0.4rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                      <select
                        value={line.frequency}
                        onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                        style={{ padding: '0.4rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                      >
                        <option value="1-0-1">1-0-1 (Morning & Night)</option>
                        <option value="1-0-0">1-0-0 (Morning)</option>
                        <option value="1-1-1">1-1-1 (Thrice)</option>
                        <option value="0-0-1">0-0-1 (Night)</option>
                        <option value="S-O-S">S-O-S (When in Pain)</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Days"
                        value={line.days}
                        onChange={(e) => handleMedicineChange(idx, 'days', e.target.value)}
                        style={{ padding: '0.4rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                      <input
                        type="text"
                        placeholder="Instructions"
                        value={line.instructions}
                        onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                        style={{ padding: '0.4rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicineRow(idx)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Physiotherapy Advice & Precautions</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Hot fomentation twice daily, ergonomic desk chair adjustments, avoid heavy deadlifts"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save & Issue Prescription</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE RX SLIP MODAL */}
      {isSlipOpen && activeSlip && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '100%', maxWidth: '680px', padding: '2rem' }}>
            <div className="printable-area" style={{ border: '2px solid #0f172a', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '4px' }}>
              {/* Slip Header */}
              <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>PhysioCare Rehabilitation Clinic</h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>402 Medical Arts Plaza, CG Road, Ahmedabad • Tel: +91 99000 11000</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '1.1rem' }}>{activeSlip.sequence_no}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date: {activeSlip.prescription_date}</div>
                </div>
              </div>

              {/* Patient & Doctor details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                <div>
                  <div>Patient: <strong>{activeSlip.patient_name}</strong></div>
                  <div>Primary Diagnosis: <strong>{activeSlip.diagnosis}</strong></div>
                </div>
                <div>
                  <div>Doctor: <strong>{activeSlip.doctor_name}</strong></div>
                  <div>Prescribed Modality: <strong>{activeSlip.treatment_name || 'Manual Therapy'}</strong></div>
                </div>
              </div>

              {/* Medicines List */}
              <div style={{ padding: '1.25rem 0' }}>
                <div style={{ fontSize: '1.25rem', fontFamily: 'serif', fontWeight: 800, color: '#0284c7', marginBottom: '0.75rem' }}>℞ Medicines</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                      <th style={{ padding: '0.4rem 0' }}>Medicine</th>
                      <th style={{ padding: '0.4rem 0' }}>Dosage</th>
                      <th style={{ padding: '0.4rem 0' }}>Frequency</th>
                      <th style={{ padding: '0.4rem 0' }}>Duration</th>
                      <th style={{ padding: '0.4rem 0' }}>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSlip.medicines?.map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.5rem 0', fontWeight: 700 }}>{m.medicine_name}</td>
                        <td style={{ padding: '0.5rem 0' }}>{m.dosage}</td>
                        <td style={{ padding: '0.5rem 0' }}>{m.frequency}</td>
                        <td style={{ padding: '0.5rem 0' }}>{m.days} Days</td>
                        <td style={{ padding: '0.5rem 0', color: '#64748b' }}>{m.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Clinical Advice */}
              <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '4px', fontSize: '0.8rem', color: '#334155', marginTop: '0.5rem' }}>
                <strong>Clinical Advice & Restrictions:</strong> {activeSlip.notes || 'Apply hot fomentation twice daily. Avoid forward spinal flexion.'}
              </div>

              {/* Signature */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem' }}>
                <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '200px', paddingTop: '0.4rem', fontSize: '0.8rem', color: '#475569' }}>
                  Authorized Signatory & Seal<br />
                  <strong>{activeSlip.doctor_name}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-outline" onClick={() => setIsSlipOpen(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
