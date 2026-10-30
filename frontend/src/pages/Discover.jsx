import { useState, useEffect } from 'react';
import PetCard from '../components/PetCard';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SPECIES = ['all', 'dog', 'cat', 'bird', 'rabbit', 'other'];

export default function Discover() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [species, setSpecies] = useState('all');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPets = async () => {
    setLoading(true);
    try {
      const params = { status: 'available', page, limit: 12 };
      if (search) params.search = search;
      if (species !== 'all') params.species = species;
      if (location) params.location = location;
      const res = await api.get('/pets', { params });
      setPets(res.data.pets);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load pets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPets(); }, [species, page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchPets(); };

  return (
    <div className="discover-page">
      <div className="discover-header">
        <h1>Find Your <span className="gradient-text">Perfect Match</span></h1>
        <p>{total} rescue animals waiting for a loving home</p>
      </div>

      {/* Search & Filters */}
      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="🔍 Search by name, breed..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          <input
            type="text"
            placeholder="📍 Filter by location..."
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>

        <div className="species-filter">
          {SPECIES.map(s => (
            <button key={s} className={`species-btn ${species === s ? 'active' : ''}`}
              onClick={() => { setSpecies(s); setPage(1); }}>
              {s === 'all' ? '🐾 All' : s === 'dog' ? '🐶 Dogs' : s === 'cat' ? '🐱 Cats' :
               s === 'bird' ? '🐦 Birds' : s === 'rabbit' ? '🐰 Rabbits' : '🦎 Others'}
            </button>
          ))}
        </div>
      </div>

      {/* Pet Grid */}
      {loading ? (
        <div className="loading-grid">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton-card"></div>)}
        </div>
      ) : pets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🐾</div>
          <h3>No pets found</h3>
          <p>Try adjusting your filters or check back soon!</p>
        </div>
      ) : (
        <div className="pet-grid">
          {pets.map(pet => <PetCard key={pet._id} pet={pet} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="page-info">Page {page} of {totalPages}</span>
          <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
