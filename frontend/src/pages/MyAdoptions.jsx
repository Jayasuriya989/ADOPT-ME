import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusColors = {
  application: '#6366f1', 'declaration-pending': '#f59e0b', trial: '#3b82f6',
  'permanently-adopted': '#22c55e', returned: '#ef4444', rejected: '#9ca3af'
};

const statusIcons = {
  application: '📝', 'declaration-pending': '✍️', trial: '⏳',
  'permanently-adopted': '💜', returned: '↩️', rejected: '❌'
};

export default function MyAdoptions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [adoptions, setAdoptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [declarationModal, setDeclarationModal] = useState(null);
  const [declForm, setDeclForm] = useState({ customerName: '', customerAddress: '', customerPhone: '', signatureData: '' });
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    api.get('/adoptions/my')
      .then(res => setAdoptions(res.data.adoptions))
      .catch(() => toast.error('Failed to load adoptions'))
      .finally(() => setLoading(false));
  }, []);

  const handleSignDeclaration = async (adoptionId) => {
    if (!declForm.customerName || !declForm.customerAddress || !declForm.customerPhone) {
      toast.error('Please fill all fields'); return;
    }
    setSigning(true);
    try {
      await api.post(`/adoptions/${adoptionId}/sign-declaration`, {
        ...declForm,
        signatureData: declForm.customerName // Using typed name as signature
      });
      toast.success('🎉 Declaration signed! Trial period has started!');
      setDeclarationModal(null);
      // Refresh
      const res = await api.get('/adoptions/my');
      setAdoptions(res.data.adoptions);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signing failed');
    } finally { setSigning(false); }
  };

  const getTrialProgress = (startDate, endDate) => {
    const total = new Date(endDate) - new Date(startDate);
    const elapsed = new Date() - new Date(startDate);
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  };

  const getDaysLeft = (endDate) => {
    const diff = new Date(endDate) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div><p>Loading your adoptions...</p></div>;

  return (
    <div className="my-adoptions-page">
      <div className="dashboard-header">
        <div>
          <h1>My Adoptions</h1>
          <p>Track your adoption journey, sign declarations, and submit monthly updates</p>
        </div>
        <Link to="/discover" className="btn-primary">🔍 Find More Pets</Link>
      </div>

      {adoptions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🐾</div>
          <h3>No adoptions yet</h3>
          <p>Browse pets and start your adoption journey!</p>
          <Link to="/discover" className="btn-primary">Browse Pets</Link>
        </div>
      ) : (
        <div className="adoptions-timeline">
          {adoptions.map(adoption => (
            <div key={adoption._id} className="adoption-timeline-card">
              <div className="timeline-left">
                {adoption.pet?.images?.[0]
                  ? <img src={adoption.pet.images[0]} alt="" className="timeline-pet-img" />
                  : <div className="timeline-pet-placeholder">🐾</div>
                }
              </div>
              <div className="timeline-body">
                <div className="timeline-header">
                  <h3>{adoption.pet?.name} <span className="species-label">({adoption.pet?.species})</span></h3>
                  <span className="status-pill" style={{ background: statusColors[adoption.status] }}>
                    {statusIcons[adoption.status]} {adoption.status.replace(/-/g, ' ')}
                  </span>
                </div>
                <p className="timeline-ngo">🏥 {adoption.ngo?.ngoDetails?.organizationName || adoption.ngo?.name}</p>
                <p className="timeline-date">Applied: {new Date(adoption.createdAt).toLocaleDateString()}</p>

                {/* Status-specific content */}
                {adoption.status === 'application' && (
                  <div className="status-info pending-box">
                    <p>⏳ Your application is under review by the NGO. You'll be notified once approved.</p>
                  </div>
                )}

                {adoption.status === 'declaration-pending' && (
                  <div className="status-info action-required">
                    <p>✍️ <strong>Action Required!</strong> Please sign the digital adoption declaration to start the trial period.</p>
                    <button className="btn-primary" onClick={() => {
                      setDeclarationModal(adoption);
                      setDeclForm({ customerName: user.name, customerAddress: user.address || '', customerPhone: user.phone || '', signatureData: '' });
                    }}>
                      ✍️ Sign Declaration
                    </button>
                  </div>
                )}

                {adoption.status === 'trial' && adoption.trial && (
                  <div className="status-info trial-info">
                    <div className="trial-header">
                      <span>⏳ Trial Period Active</span>
                      <span className="days-left">{getDaysLeft(adoption.trial.endDate)} days left</span>
                    </div>
                    <div className="trial-progress-bar">
                      <div className="trial-progress-fill" style={{ width: `${getTrialProgress(adoption.trial.startDate, adoption.trial.endDate)}%` }}></div>
                    </div>
                    <p className="trial-dates">
                      {new Date(adoption.trial.startDate).toLocaleDateString()} → {new Date(adoption.trial.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {adoption.status === 'permanently-adopted' && (
                  <div className="status-info adopted-info">
                    <p>🎉 <strong>Congratulations!</strong> Adoption permanently completed on {new Date(adoption.permanentlyAdoptedAt).toLocaleDateString()}!</p>
                    <Link to={`/updates/${adoption._id}`} className="btn-primary">
                      📊 Submit Monthly Update
                    </Link>
                  </div>
                )}

                {adoption.status === 'rejected' && (
                  <div className="status-info rejected-info">
                    <p>❌ Application rejected. {adoption.ngoNotes && `Reason: ${adoption.ngoNotes}`}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Declaration Modal */}
      {declarationModal && (
        <div className="detail-panel-overlay" onClick={() => setDeclarationModal(null)}>
          <div className="detail-panel declaration-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setDeclarationModal(null)}>✕</button>
            <h2>✍️ Digital Adoption Declaration</h2>
            <div className="declaration-text">
              <h4>By signing this declaration, you agree to:</h4>
              <ol>
                <li>Provide proper care, shelter, food, and medical attention to <strong>{declarationModal.pet?.name}</strong>.</li>
                <li>Compensate the NGO for any damages or mistreatment caused to the pet.</li>
                <li>Complete the <strong>one-week trial period</strong> and comply with all monitoring requirements.</li>
                <li>Submit <strong>monthly health reports</strong> for three months post-adoption.</li>
                <li>Return the pet if unable to provide adequate care.</li>
              </ol>
            </div>
            <div className="form-group">
              <label>Full Name (as signature) *</label>
              <input value={declForm.customerName} onChange={e => setDeclForm({ ...declForm, customerName: e.target.value })}
                placeholder="Type your full name" required />
            </div>
            <div className="form-group">
              <label>Your Address *</label>
              <input value={declForm.customerAddress} onChange={e => setDeclForm({ ...declForm, customerAddress: e.target.value })}
                placeholder="Full address" required />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input value={declForm.customerPhone} onChange={e => setDeclForm({ ...declForm, customerPhone: e.target.value })}
                placeholder="+91 9999999999" required />
            </div>
            <div className="signature-box">
              <p>🖊️ Signed by: <strong>{declForm.customerName || '_______________'}</strong></p>
              <p>Date: {new Date().toLocaleDateString()}</p>
            </div>
            <button className="btn-primary btn-full" onClick={() => handleSignDeclaration(declarationModal._id)} disabled={signing}>
              {signing ? '⏳ Signing...' : '✅ I Agree & Sign Declaration'}
            </button>
            <p className="decl-note">This starts your 7-day trial period immediately.</p>
          </div>
        </div>
      )}
    </div>
  );
}
