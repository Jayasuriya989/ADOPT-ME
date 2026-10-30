import { Link } from 'react-router-dom';

const speciesEmoji = { dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾' };
const statusColor = { available: '#22c55e', 'in-trial': '#f59e0b', adopted: '#6366f1', returned: '#ef4444' };

export default function PetCard({ pet }) {
  return (
    <Link to={`/pet/${pet._id}`} className="pet-card">
      <div className="pet-card-image-wrap">
        {pet.images?.[0] ? (
          <img src={pet.images[0]} alt={pet.name} className="pet-card-img" />
        ) : (
          <div className="pet-card-placeholder">{speciesEmoji[pet.species] || '🐾'}</div>
        )}
        <span className="pet-status-badge" style={{ background: statusColor[pet.status] }}>
          {pet.status === 'available' ? '✅ Available' :
           pet.status === 'in-trial' ? '⏳ In Trial' :
           pet.status === 'adopted' ? '💜 Adopted' : '↩️ Returned'}
        </span>
        {pet.healthStatus?.vaccinated && <span className="vacc-badge">💉 Vaccinated</span>}
      </div>
      <div className="pet-card-body">
        <div className="pet-card-header">
          <h3 className="pet-name">{pet.name}</h3>
          <span className="pet-species-emoji">{speciesEmoji[pet.species]}</span>
        </div>
        <p className="pet-breed">{pet.breed || pet.species} {pet.age && `• ${pet.age}`}</p>
        <p className="pet-location">📍 {pet.location || pet.ngo?.ngoDetails?.organizationName || 'Location TBD'}</p>
        <p className="pet-desc">{pet.description?.slice(0, 80)}{pet.description?.length > 80 ? '...' : ''}</p>
        <div className="pet-tags">
          {pet.gender && <span className="tag">{pet.gender === 'male' ? '♂' : '♀'} {pet.gender}</span>}
          {pet.size && <span className="tag">{pet.size}</span>}
          {pet.healthStatus?.neutered && <span className="tag">neutered</span>}
        </div>
      </div>
    </Link>
  );
}
