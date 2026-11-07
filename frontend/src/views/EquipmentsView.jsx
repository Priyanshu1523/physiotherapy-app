import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Wrench, Plus, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function EquipmentsView() {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serial_no: '',
    purchase_date: new Date().toISOString().split('T')[0],
    warranty_expiry: '',
    status: 'available',
    notes: '',
  });

  useEffect(() => {
    loadEquipments();
  }, []);

  const loadEquipments = async () => {
    try {
      setLoading(true);
      const res = await api.getEquipments();
      if (res.success) setEquipments(res.data);
    } catch (err) {
      console.error('Failed to load equipments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (eq) => {
    const nextStatus = eq.status === 'available' ? 'in_use' : eq.status === 'in_use' ? 'maintenance' : 'available';
    try {
      const res = await api.updateEquipmentStatus(eq.id, nextStatus);
      if (res.success) loadEquipments();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createEquipment(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          model: '',
          serial_no: '',
          purchase_date: new Date().toISOString().split('T')[0],
          warranty_expiry: '',
          status: 'available',
          notes: '',
        });
        loadEquipments();
      }
    } catch (err) {
      alert('Error adding equipment: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Therapy Equipment & Asset Maintenance</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Track ultrasound transducers, traction motors, electrotherapy machines, calibration schedules</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> Register Equipment
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading equipment records...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {equipments.map((eq) => (
            <div
              key={eq.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      backgroundColor:
                        eq.status === 'available'
                          ? '#dcfce7'
                          : eq.status === 'in_use'
                          ? '#e0f2fe'
                          : '#fee2e2',
                      color:
                        eq.status === 'available'
                          ? '#15803d'
                          : eq.status === 'in_use'
                          ? '#0369a1'
                          : '#b91c1c',
                    }}
                  >
                    {eq.status.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{eq.model}</span>
                </div>

                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                  {eq.name}
                </h4>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  Serial No: <strong>{eq.serial_no}</strong>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#475569' }}>
                  {eq.notes || 'Operating within clinical safety parameters.'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', color: '#64748b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Last Maintenance:</span>
                  <strong style={{ color: '#0f172a' }}>{eq.last_maintenance_date || 'Recent'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Next Calibration:</span>
                  <strong style={{ color: '#0284c7' }}>{eq.next_maintenance_date || 'Scheduled'}</strong>
                </div>

                <button
                  onClick={() => handleToggleStatus(eq)}
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.75rem' }}
                >
                  Change Status (Available / In-Use / Maintenance)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD EQUIPMENT MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', width: '100%', maxWidth: '520px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Register Clinic Equipment</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <form onSubmit={handleAddEquipment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Equipment / Device Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chattanooga Intelect Ultrasound"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Serial Number</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-TRAC-2026"
                    value={formData.serial_no}
                    onChange={(e) => setFormData({ ...formData, serial_no: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    <option value="available">Available (Operational)</option>
                    <option value="in_use">Currently In Use</option>
                    <option value="maintenance">Under Maintenance / Calibration</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Notes / Calibration Details</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Equipment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
