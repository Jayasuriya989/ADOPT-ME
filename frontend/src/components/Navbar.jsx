import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🐾</span>
          <span className="logo-text">AdoptMe</span>
        </Link>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span><span></span>
        </button>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/discover" className={`nav-link ${isActive('/discover') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            🔍 Discover
          </Link>
          <Link to="/emergency" className="nav-link emergency-link" onClick={() => setMenuOpen(false)}>
            🚨 Help an Animal
          </Link>

          {!user ? (
            <>
              <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn-primary nav-btn" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          ) : (
            <>
              {user.role === 'ngo' && (
                <>
                  <Link to="/ngo/dashboard" className={`nav-link ${isActive('/ngo/dashboard') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Dashboard</Link>
                  <Link to="/ngo/adoptions" className={`nav-link ${isActive('/ngo/adoptions') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Adoptions</Link>
                  <Link to="/ngo/monitoring" className={`nav-link ${isActive('/ngo/monitoring') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Monitoring</Link>
                  <Link to="/ngo/emergency" className={`nav-link ${isActive('/ngo/emergency') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Reports</Link>
                </>
              )}
              {user.role === 'customer' && (
                <>
                  <Link to="/my-adoptions" className={`nav-link ${isActive('/my-adoptions') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>My Pets</Link>
                </>
              )}
              <div className="nav-user">
                <div className="avatar">{user.name?.charAt(0).toUpperCase()}</div>
                <span className="user-name">{user.name?.split(' ')[0]}</span>
                <span className={`role-badge role-${user.role}`}>{user.role}</span>
              </div>
              <button className="btn-outline nav-btn" onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
