import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-blob blob1"></div>
          <div className="hero-blob blob2"></div>
          <div className="hero-blob blob3"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">🐾 Responsible Pet Adoption</div>
          <h1 className="hero-title">
            Find Your <span className="gradient-text">Forever</span><br />
            Companion
          </h1>
          <p className="hero-subtitle">
            Connect with verified NGOs, adopt with care, and give rescued animals the loving home they deserve.
          </p>
          <div className="hero-actions">
            <Link to="/discover" className="btn-primary btn-lg">
              🔍 Browse Pets
            </Link>
            <Link to="/emergency" className="btn-emergency btn-lg">
              🚨 Report Emergency
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat-item"><span className="stat-number">500+</span><span className="stat-label">Pets Rescued</span></div>
            <div className="stat-divider"></div>
            <div className="stat-item"><span className="stat-number">120+</span><span className="stat-label">NGO Partners</span></div>
            <div className="stat-divider"></div>
            <div className="stat-item"><span className="stat-number">98%</span><span className="stat-label">Success Rate</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card fc1">🐶<span>Max is waiting!</span></div>
          <div className="floating-card fc2">🐱<span>Luna needs you</span></div>
          <div className="floating-card fc3">🐦<span>Tweety found home ✅</span></div>
          <div className="hero-circle">
            <span className="hero-emoji">🐾</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">How <span className="gradient-text">AdoptMe</span> Works</h2>
        <p className="section-sub">A responsible adoption journey in 4 simple steps</p>
        <div className="steps-grid">
          {[
            { icon: '🔍', step: '01', title: 'Discover', desc: 'Browse our gallery of rescued animals from verified NGOs near you.' },
            { icon: '📝', step: '02', title: 'Apply & Declare', desc: 'Submit your application and sign a digital care declaration.' },
            { icon: '🏠', step: '03', title: '7-Day Trial', desc: 'Take the pet home for a one-week trial period with full support.' },
            { icon: '💜', step: '04', title: 'Forever Home', desc: 'After 3 months of health monitoring, officially complete the adoption.' }
          ].map(s => (
            <div key={s.step} className="step-card">
              <div className="step-number">{s.step}</div>
              <div className="step-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="features-grid">
          <div className="feature-card feature-emergency">
            <div className="feature-icon">🚨</div>
            <h3>Emergency Rescue</h3>
            <p>Report a wounded animal from anywhere — even without an account. We route alerts to the nearest NGO instantly.</p>
            <Link to="/emergency" className="feature-link">Report Now →</Link>
          </div>
          <div className="feature-card feature-monitor">
            <div className="feature-icon">📊</div>
            <h3>3-Month Monitoring</h3>
            <p>Post-adoption care tracking with monthly health updates ensures every pet thrives in their new home.</p>
          </div>
          <div className="feature-card feature-ngo">
            <div className="feature-icon">🏥</div>
            <h3>Verified NGOs</h3>
            <p>Every rescue organization is verified before listing pets. Transparent, accountable, and trustworthy.</p>
            {!user && <Link to="/register" className="feature-link">Register as NGO →</Link>}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Make a Difference?</h2>
          <p>Join thousands of families who've given rescued animals a second chance at life.</p>
          <div className="cta-actions">
            {!user ? (
              <>
                <Link to="/register" className="btn-primary btn-lg">Create Account</Link>
                <Link to="/discover" className="btn-outline btn-lg">Browse Pets</Link>
              </>
            ) : (
              <Link to={user.role === 'ngo' ? '/ngo/dashboard' : '/discover'} className="btn-primary btn-lg">
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo-icon">🐾</span>
            <span>AdoptMe</span>
          </div>
          <p>© 2024 AdoptMe. Connecting hearts with paws.</p>
          <div className="footer-links">
            <Link to="/discover">Discover</Link>
            <Link to="/emergency">Emergency</Link>
            <Link to="/register">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
