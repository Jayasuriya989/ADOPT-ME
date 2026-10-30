import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const speciesEmoji = { dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾' };

export default function PetDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [applying, setApplying] = useState(false);
  const [notes, setNotes] = useState('');
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    api.get(`/pets/${id}`)
      .then(res => setPet(res.data.pet))
      .catch(() => toast.error('Pet not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setApplying(true);
    try {
      await api.post('/adoptions/apply', { petId: id, applicationNotes: notes });
      toast.success('Application submitted! The NGO will review it. 🐾');
      setShowApply(false);
      navigate('/my-adoptions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div><p>Loading...</p></div>;
  if (!pet) return <div className="error-page"><h2>Pet not found</h2><Link to="/discover">← Back</Link></div>;

  return (
    <div className="pet-detail-page">
      <div className="pet-detail-container">
        {/* Image Gallery */}
        <div className="pet-gallery">
          <div className="gallery-main">
            {pet.images?.[activeImg] ? (
              <img src={pet.images[activeImg]} alt={pet.name} className="gallery-main-img" />
            ) : (
              <div className="gallery-placeholder">{speciesEmoji[pet.species]}</div>
            )}
            <span className="gallery-status" style={{
              background: pet.status === 'available' ? '#22c55e' : pet.status === 'in-trial' ? '#f59e0b' : '#6366f1'
            }}>
              {pet.status === 'available' ? '✅ Available' : pet.status === 'in-trial' ? '⏳ In Trial' : '💜 Adopted'}
            </span>
          </div>
          {pet.images?.length > 1 && (
            <div className="gallery-thumbs">
              {pet.images.map((img, i) => (
                <img key={i} src={img} alt="" className={`thumb ${i === activeImg ? 'active' : ''}`}
                  onClick={() => setActiveImg(i)} />
              ))}
            </div>
          )}
        </div>

        {/* Pet Info */}
        <div className="pet-info-panel">
          <div className="pet-info-header">
            <h1>{pet.name} {speciesEmoji[pet.species]}</h1>
            {pet.ngo && <p className="pet-ngo">🏥 {pet.ngo.ngoDetails?.organizationName || pet.ngo.name}</p>}
          </div>

          <div className="pet-info-grid">
            {[
              { label: 'Species', value: pet.species },
              { label: 'Breed', value: pet.breed || 'Unknown' },
              { label: 'Age', value: pet.age || 'Unknown' },
              { label: 'Gender', value: pet.gender },
              { label: 'Size', value: pet.size },
              { label: 'Color', value: pet.color }
            ].filter(i => i.value).map(item => (
              <div key={item.label} className="info-chip">
                <span className="chip-label">{item.label}</span>
                <span className="chip-value">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Health Status */}
          <div className="health-card">
            <h3>🏥 Health Status</h3>
            <div className="health-badges">
              <span className={`health-badge ${pet.healthStatus?.vaccinated ? 'yes' : 'no'}`}>
                {pet.healthStatus?.vaccinated ? '✅' : '❌'} Vaccinated
              </span>
              <span className={`health-badge ${pet.healthStatus?.neutered ? 'yes' : 'no'}`}>
                {pet.healthStatus?.neutered ? '✅' : '❌'} Neutered
              </span>
              <span className={`health-badge ${pet.healthStatus?.microchipped ? 'yes' : 'no'}`}>
                {pet.healthStatus?.microchipped ? '✅' : '❌'} Microchipped
              </span>
            </div>
            {pet.healthStatus?.healthNotes && <p className="health-notes">{pet.healthStatus.healthNotes}</p>}
          </div>

          {/* Description */}
          <div className="pet-description">
            <h3>About {pet.name}</h3>
            <p>{pet.description}</p>
          </div>

          {pet.location && <p className="pet-location-detail">📍 {pet.location}</p>}

          {/* Action Button */}
          {user?.role === 'customer' && pet.status === 'available' && (
            <button className="btn-primary btn-full btn-lg" onClick={() => setShowApply(!showApply)}>
              🐾 Apply to Adopt {pet.name}
            </button>
          )}
          {!user && pet.status === 'available' && (
            <Link to="/login" className="btn-primary btn-full btn-lg">🔑 Login to Adopt</Link>
          )}
          {pet.status !== 'available' && (
            <div className="not-available-msg">
              This pet is currently {pet.status === 'in-trial' ? 'in a trial period' : 'already adopted'}.
            </div>
          )}

          {/* Apply Form */}
          {showApply && (
            <form onSubmit={handleApply} className="apply-form">
              <h3>📝 Adoption Application</h3>
              <p className="apply-info">Tell the NGO why you'd be a great owner for {pet.name}!</p>
              <textarea
                placeholder="Why do you want to adopt this pet? Do you have experience with animals? Describe your living situation..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={5}
                required
              />
              <button type="submit" className="btn-primary btn-full" disabled={applying}>
                {applying ? '⏳ Submitting...' : '📤 Submit Application'}
              </button>
              <button type="button" className="btn-outline btn-full" onClick={() => setShowApply(false)}>Cancel</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
