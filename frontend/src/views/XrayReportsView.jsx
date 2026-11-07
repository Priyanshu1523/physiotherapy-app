import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { FileSearch, Plus, Eye, Calendar, User } from 'lucide-react';

export default function XrayReportsView() {
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState(null);

  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    test_type: 'Digital X-Ray Cervical Spine',
    report_date: new Date().toISOString().split('T')[0],
    findings: '',
    impression: '',
    remarks: '',
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [xRes, patRes, docRes] = await Promise.all([
        api.getXrayReports(),
        api.getPatients(),
        api.getDoctors(),
      ]);

      if (xRes.success) setReports(xRes.data);
      if (patRes.success) {
        setPatients(patRes.data);
        if (patRes.data.length > 0) setFormData((f) => ({ ...f, patient_id: patRes.data[0].id }));
      }
      if (docRes.success) {
        setDoctors(docRes.data);
        if (docRes.data.length > 0) setFormData((f) => ({ ...f, doctor_id: docRes.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load xray reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReport = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createXrayReport(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        setFormData({
          ...formData,
          findings: '',
          impression: '',
          remarks: '',
        });
        loadReports();
      }
    } catch (err) {
      alert('Error saving report: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Diagnostic Imaging & Radiological Reports</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Maintain patient X-Ray, MRI, CT scans, radiological impressions, and clinical findings</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> New Diagnostic Report
        </button>
      </div>

      {/* Reports Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="clinic-table">
          <thead>
            <tr>
              <th>Report No.</th>
              <th>Date</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Diagnostic Investigation</th>
              <th>Clinical Impression</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading diagnostic reports...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  No diagnostic imaging reports recorded.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#0284c7' }}>{r.report_no}</span>
                  </td>
                  <td>{r.report_date}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.patient_name}</div>
                  </td>
                  <td>{r.doctor_name}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.test_type}</div>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.impression}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => setActiveReport(r)}
                    >
                      <Eye size={14} /> View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW REPORT DETAILS MODAL */}
      {activeReport && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '100%', maxWidth: '640px', padding: '2rem' }}>
            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  {activeReport.report_no}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>{activeReport.test_type}</h3>
              </div>
              <button onClick={() => setActiveReport(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              <div>Patient: <strong>{activeReport.patient_name}</strong></div>
              <div>Consultant: <strong>{activeReport.doctor_name}</strong></div>
              <div>Report Date: <strong>{activeReport.report_date}</strong></div>
              <div>Status: <span style={{ color: '#16a34a', fontWeight: 700 }}>Verified</span></div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Radiological Findings:</h4>
              <p style={{ fontSize: '0.85rem', color: '#0f172a', lineHeight: 1.5, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '0.375rem' }}>
                {activeReport.findings}
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Impression & Diagnosis:</h4>
              <p style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 600, lineHeight: 1.5, backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '0.75rem', borderRadius: '0.375rem' }}>
                {activeReport.impression}
              </p>
            </div>

            {activeReport.remarks && (
              <div style={{ marginBottom: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                <strong>Remarks / Physio Recommendations:</strong> {activeReport.remarks}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setActiveReport(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW REPORT MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '100%', maxWidth: '600px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Record Diagnostic Imaging</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <form onSubmit={handleAddReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Patient *</label>
                  <select
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.patient_code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Doctor *</label>
                  <select
                    value={formData.doctor_id}
                    onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Investigation / Scan Type *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lumbar Spine MRI, Right Knee AP & Lateral X-Ray"
                  value={formData.test_type}
                  onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Radiological Findings</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Detailed anatomical observations, disc space, osteophytes..."
                  value={formData.findings}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                ></textarea>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Diagnostic Impression *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. L4-L5 disc protrusion causing bilateral nerve root impingement"
                  value={formData.impression}
                  onChange={(e) => setFormData({ ...formData, impression: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
