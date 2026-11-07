import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Pill, Plus, Search, Trash2, Tag, Building2, IndianRupee, ShieldCheck } from 'lucide-react';

export default function MedicinesView({ currentUser, setActiveTab }) {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedForm, setSelectedForm] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    form: 'Tablet',
    dosage: '',
    manufacturer: '',
    price: '150',
    notes: '',
  });

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const res = await api.getMedicines();
      if (res.success && res.data) {
        setMedicines(res.data);
      }
    } catch (err) {
      console.error('Failed to load medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createMedicine(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        setFormData({ name: '', form: 'Tablet', dosage: '', manufacturer: '', price: '150', notes: '' });
        loadMedicines();
      }
    } catch (err) {
      alert('Failed to add medicine: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this medicine from inventory?')) {
      try {
        await api.deleteMedicine(id);
        loadMedicines();
      } catch (err) {
        alert('Failed to delete medicine: ' + err.message);
      }
    }
  };

  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch = m.name?.toLowerCase().includes(search.toLowerCase()) ||
                          m.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
                          m.notes?.toLowerCase().includes(search.toLowerCase());
    const matchesForm = selectedForm === 'All' || m.form === selectedForm;
    return matchesSearch && matchesForm;
  });

  const forms = ['All', 'Tablet', 'Capsule', 'Gel', 'Spray', 'Syrup', 'Injection'];

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Pill size={24} color="#0284c7" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Medicines & Clinical Pharmacy Catalog
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
            Ported from Odoo 19 <code>medical.medicine</code>: Clinical medications, muscle relaxants, analgesics, and topical ointments.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> Add New Medicine
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '360px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search medicine, salt, manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.2rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {forms.map((f) => (
            <button
              key={f}
              onClick={() => setSelectedForm(f)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: selectedForm === f ? '#0284c7' : '#f1f5f9',
                color: selectedForm === f ? '#ffffff' : '#475569',
                fontWeight: selectedForm === f ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Medicines Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="clinic-table">
          <thead>
            <tr>
              <th>Medicine Name</th>
              <th>Form & Strength</th>
              <th>Manufacturer</th>
              <th>Standard Price</th>
              <th>Clinical Usage / Indications</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading medicines...
                </td>
              </tr>
            ) : filteredMedicines.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  No medicines found.
                </td>
              </tr>
            ) : (
              filteredMedicines.map((med) => (
                <tr key={med.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{med.name}</div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: #{med.id}</span>
                  </td>
                  <td>
                    <span style={{
                      backgroundColor: med.form === 'Gel' ? '#f0fdf4' : med.form === 'Capsule' ? '#fef3c7' : '#e0f2fe',
                      color: med.form === 'Gel' ? '#15803d' : med.form === 'Capsule' ? '#b45309' : '#0369a1',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      marginRight: '6px',
                    }}>
                      {med.form}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: '#475569' }}>{med.dosage}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: '#334155' }}>
                      <Building2 size={13} color="#64748b" /> {med.manufacturer || 'Cipla'}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                      ₹{med.price || 150}
                    </span>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                      {med.notes || 'Physiotherapy supportive medication'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        onClick={() => setActiveTab && setActiveTab('prescriptions')}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        Prescribe
                      </button>
                      <button
                        onClick={() => handleDelete(med.id)}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '0.3rem',
                          borderRadius: '4px',
                        }}
                        title="Remove Medicine"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Medicine Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Add New Medicine (Odoo Formulation)</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleAddMedicine} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Medicine Name / Salt Composition *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aceclofenac + Paracetamol + Serratiopeptidase"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Dosage Form *</label>
                  <select
                    value={formData.form}
                    onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontWeight: 600 }}
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Gel">Gel / Ointment</option>
                    <option value="Spray">Spray</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Strength / Dosage *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 100mg + 325mg + 15mg"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Cipla, Sun Pharma, Zydus"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Standard Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Clinical Indications & Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Indicated for post-exercise swelling and soft tissue trauma"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
