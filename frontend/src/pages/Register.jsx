import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('customer');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '', address: '',
    ngoDetails: { organizationName: '', registrationNumber: '', website: '', description: '', location: { address: '' } }
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updateNGO = (field, value) => setForm(prev => ({
    ...prev, ngoDetails: { ...prev.ngoDetails, [field]: value }
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role, phone: form.phone, address: form.address };
      if (role === 'ngo') payload.ngoDetails = form.ngoDetails;
      await register(payload);
      toast.success('Welcome to AdoptMe! 🐾');
      navigate(role === 'ngo' ? '/ngo/dashboard' : '/discover');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-logo">🐾 AdoptMe</Link>
          <h2>Create Your Account</h2>
          <p>Join thousands making a difference for animals</p>
        </div>

        {/* Role Selector */}
        <div className="role-selector">
          <button className={`role-btn ${role === 'customer' ? 'active' : ''}`} onClick={() => setRole('customer')}>
            <span>👤</span> I want to Adopt
          </button>
          <button className={`role-btn ${role === 'ngo' ? 'active' : ''}`} onClick={() => setRole('ngo')}>
            <span>🏥</span> I'm an NGO
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Step 1: Basic Info */}
          <div className="form-group">
            <label>Full Name *</label>
            <input type="text" placeholder="Your name" value={form.name} onChange={e => update('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" placeholder="your@email.com" value={form.email} onChange={e => update('email', e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Password *</label>
              <input type="password" placeholder="Min 6 chars" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <input type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" placeholder="+91 9999999999" value={form.phone} onChange={e => update('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input type="text" placeholder="Your city/address" value={form.address} onChange={e => update('address', e.target.value)} />
            </div>
          </div>

          {/* NGO Additional Fields */}
          {role === 'ngo' && (
            <div className="ngo-fields">
              <div className="ngo-fields-title">🏥 NGO Details</div>
              <div className="form-group">
                <label>Organization Name *</label>
                <input type="text" placeholder="Your NGO name" value={form.ngoDetails.organizationName}
                  onChange={e => updateNGO('organizationName', e.target.value)} required={role === 'ngo'} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Registration Number</label>
                  <input type="text" placeholder="Reg. number" value={form.ngoDetails.registrationNumber}
                    onChange={e => updateNGO('registrationNumber', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input type="url" placeholder="https://yourorg.com" value={form.ngoDetails.website}
                    onChange={e => updateNGO('website', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>NGO Location / City *</label>
                <input type="text" placeholder="City or full address of your NGO" value={form.ngoDetails.location.address}
                  onChange={e => updateNGO('location', { ...form.ngoDetails.location, address: e.target.value })} required={role === 'ngo'} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Tell us about your organization..." value={form.ngoDetails.description}
                  onChange={e => updateNGO('description', e.target.value)} rows={3} />
              </div>
              <div className="info-box">
                ℹ️ Your NGO account will be reviewed and verified by our team before going live.
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? '⏳ Creating Account...' : `🐾 Create ${role === 'ngo' ? 'NGO' : ''} Account`}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
