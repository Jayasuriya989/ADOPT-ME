import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function NGODashboard() {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPet, setEditPet] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', species: 'dog', breed: '', age: '', gender: 'male', size: 'medium',
    color: '', description: '', location: '', tags: '',
    vaccinated: false, neutered: false, microchipped: false, healthNotes: ''
  });
  const [images, setImages] = useState([]);
  const fileRef = useRef();

  const fetchPets = async () => {
    try {
      const res = await api.get('/pets/ngo/my-pets');
      setPets(res.data.pets);
    } catch { toast.error('Failed to load pets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPets(); }, []);

  const resetForm = () => {
    setForm({ name: '', species: 'dog', breed: '', age: '', gender: 'male', size: 'medium', color: '', description: '', location: '', tags: '', vaccinated: false, neutered: false, microchipped: false, healthNotes: '' });
    setImages([]); setEditPet(null);
  };

  const openEdit = (pet) => {
    setEditPet(pet);
    setForm({
      name: pet.name, species: pet.species, breed: pet.breed || '', age: pet.age || '',
      gender: pet.gender || 'male', size: pet.size || 'medium', color: pet.color || '',
      description: pet.description, location: pet.location || '',
      tags: pet.tags?.join(', ') || '',
      vaccinated: pet.healthStatus?.vaccinated || false,
      neutered: pet.healthStatus?.neutered || false,
      microchipped: pet.healthStatus?.microchipped || false,
      healthNotes: pet.healthStatus?.healthNotes || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (!['vaccinated', 'neutered', 'microchipped', 'healthNotes'].includes(k)) fd.append(k, v);
      });
      fd.append('healthStatus', JSON.stringify({
        vaccinated: form.vaccinated, neutered: form.neutered,
        microchipped: form.microchipped, healthNotes: form.healthNotes
      }));
      images.forEach(img => fd.append('images', img));

      if (editPet) {
        await api.put(`/pets/${editPet._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Pet updated! ✅');
      } else {
        await api.post('/pets', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Pet listed! 🐾');
      }
      resetForm(); setShowForm(false); fetchPets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (petId) => {
    if (!confirm('Remove this pet listing?')) return;
    try {
      await api.delete(`/pets/${petId}`);
      toast.success('Pet listing removed');
      fetchPets();
    } catch { toast.error('Failed to delete'); }
  };

  const statusColor = { available: '#22c55e', 'in-trial': '#f59e0b', adopted: '#6366f1', returned: '#ef4444' };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>NGO Dashboard</h1>
          <p>Welcome, <strong>{user?.ngoDetails?.organizationName || user?.name}</strong></p>
          {user?.ngoDetails?.verificationStatus === 'pending' && (
            <div className="verification-banner">⏳ Your NGO is pending verification. Pets will be visible once approved.</div>
          )}
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? '✕ Cancel' : '+ Add Pet Listing'}
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        {[
          { label: 'Total Listings', value: pets.length, icon: '🐾' },
          { label: 'Available', value: pets.filter(p => p.status === 'available').length, icon: '✅' },
          { label: 'In Trial', value: pets.filter(p => p.status === 'in-trial').length, icon: '⏳' },
          { label: 'Adopted', value: pets.filter(p => p.status === 'adopted').length, icon: '💜' }
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-card-icon">{s.icon}</span>
            <span className="stat-card-number">{s.value}</span>
            <span className="stat-card-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="form-panel">
          <h2>{editPet ? '✏️ Edit Pet' : '🐾 Add New Pet'}</h2>
          <form onSubmit={handleSubmit} className="pet-form">
            <div className="form-row">
              <div className="form-group"><label>Pet Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bruno" required />
              </div>
              <div className="form-group"><label>Species *</label>
                <select value={form.species} onChange={e => setForm({ ...form, species: e.target.value })}>
                  {['dog', 'cat', 'bird', 'rabbit', 'other'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Breed</label>
                <input value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} placeholder="Labrador..." />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Age</label>
                <input value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="2 years" />
              </div>
              <div className="form-group"><label>Gender</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  {['male', 'female', 'unknown'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Size</label>
                <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}>
                  {['small', 'medium', 'large'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Color</label>
                <input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="Golden..." />
              </div>
            </div>
            <div className="form-group"><label>Description *</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Describe the pet's personality, history..." required />
            </div>
            <div className="form-row">
              <div className="form-group"><label>Location</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Chennai, Tamil Nadu" />
              </div>
              <div className="form-group"><label>Tags (comma separated)</label>
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="friendly, playful, trained" />
              </div>
            </div>
            <div className="health-checks">
              <label className="section-label">🏥 Health Status</label>
              <div className="check-row">
                {[['vaccinated', '💉 Vaccinated'], ['neutered', '✂️ Neutered'], ['microchipped', '📡 Microchipped']].map(([key, label]) => (
                  <label key={key} className="check-label">
                    <input type="checkbox" checked={form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} />
                    {label}
                  </label>
                ))}
              </div>
              <div className="form-group"><label>Health Notes</label>
                <input value={form.healthNotes} onChange={e => setForm({ ...form, healthNotes: e.target.value })} placeholder="Any medical notes..." />
              </div>
            </div>
            <div className="form-group">
              <label>Photos (max 5)</label>
              <div className="upload-area" onClick={() => fileRef.current.click()}>
                <span>📸 Click to upload images</span>
                <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                  onChange={e => setImages(Array.from(e.target.files))} />
              </div>
              {images.length > 0 && <p className="file-count">✅ {images.length} file(s) selected</p>}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? '⏳ Saving...' : editPet ? '✅ Update Pet' : '🐾 List Pet'}
              </button>
              <button type="button" className="btn-outline" onClick={() => { resetForm(); setShowForm(false); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Pet Listings */}
      <div className="listings-section">
        <h2>Your Pet Listings ({pets.length})</h2>
        {loading ? <div className="spinner-center"><div className="spinner"></div></div>
          : pets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🐾</div>
              <h3>No listings yet</h3>
              <p>Start by adding your first rescue animal!</p>
            </div>
          ) : (
            <div className="listings-table-wrap">
              <table className="listings-table">
                <thead>
                  <tr><th>Pet</th><th>Species</th><th>Status</th><th>Views</th><th>Added</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {pets.map(pet => (
                    <tr key={pet._id}>
                      <td>
                        <div className="table-pet-name">
                          {pet.images?.[0] && <img src={pet.images[0]} alt="" className="table-thumb" />}
                          <strong>{pet.name}</strong>
                        </div>
                      </td>
                      <td>{pet.species}</td>
                      <td><span className="status-pill" style={{ background: statusColor[pet.status] }}>{pet.status}</span></td>
                      <td>{pet.viewCount || 0}</td>
                      <td>{new Date(pet.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="action-btn edit" onClick={() => openEdit(pet)}>✏️ Edit</button>
                        <button className="action-btn delete" onClick={() => handleDelete(pet._id)}>🗑️ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
}
