import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function NGOMonitoring() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [reviewForm, setReviewForm] = useState({ flagged: false, flagReason: '', ngoComment: '' });

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const params = filter === 'flagged' ? { flagged: true } : {};
      const res = await api.get('/updates/ngo', { params });
      setUpdates(res.data.updates);
    } catch { toast.error('Failed to load updates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUpdates(); }, [filter]);

  const handleReview = async (id) => {
    try {
      await api.put(`/updates/${id}/review`, reviewForm);
      toast.success(reviewForm.flagged ? '🚨 Update flagged!' : '✅ Update reviewed!');
      setSelected(null);
      fetchUpdates();
    } catch { toast.error('Review failed'); }
  };

  const healthColor = { excellent: '#22c55e', good: '#84cc16', fair: '#f59e0b', poor: '#ef4444' };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Post-Adoption Monitoring</h1>
          <p>Review monthly health updates from adopters (3-month tracking)</p>
        </div>
        <div className="filter-btns">
          {['all', 'flagged'].map(f => (
            <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'flagged' ? '🚨 Flagged' : '📋 All Updates'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        {[
          { label: 'Total Updates', value: updates.length, icon: '📋' },
          { label: 'Reviewed', value: updates.filter(u => u.ngoReview?.reviewed).length, icon: '✅' },
          { label: 'Pending Review', value: updates.filter(u => !u.ngoReview?.reviewed).length, icon: '⏳' },
          { label: 'Flagged', value: updates.filter(u => u.ngoReview?.flagged).length, icon: '🚨' }
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-card-icon">{s.icon}</span>
            <span className="stat-card-number">{s.value}</span>
            <span className="stat-card-label">{s.label}</span>
          </div>
        ))}
      </div>

      {loading ? <div className="spinner-center"><div className="spinner"></div></div>
        : updates.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📊</div><h3>No updates yet</h3><p>Monthly reports from adopters will appear here.</p></div>
        ) : (
          <div className="updates-grid">
            {updates.map(update => (
              <div key={update._id} className={`update-card ${update.ngoReview?.flagged ? 'flagged' : ''} ${!update.ngoReview?.reviewed ? 'unreviewed' : ''}`}
                onClick={() => { setSelected(update); setReviewForm({ flagged: update.ngoReview?.flagged || false, flagReason: update.ngoReview?.flagReason || '', ngoComment: update.ngoReview?.ngoComment || '' }); }}>
                <div className="update-card-header">
                  <div className="update-meta">
                    {update.pet?.images?.[0] && <img src={update.pet.images[0]} alt="" className="update-pet-thumb" />}
                    <div>
                      <h4>{update.pet?.name}</h4>
                      <p>👤 {update.customer?.name}</p>
                    </div>
                  </div>
                  <div className="update-badges">
                    <span className="month-badge">Month {update.month}</span>
                    {update.ngoReview?.flagged && <span className="flag-badge">🚨 Flagged</span>}
                    {!update.ngoReview?.reviewed && <span className="new-badge">NEW</span>}
                    {update.healthReport?.overallHealth && (
                      <span className="health-pill" style={{ background: healthColor[update.healthReport.overallHealth] }}>
                        {update.healthReport.overallHealth}
                      </span>
                    )}
                  </div>
                </div>
                <div className="update-health-row">
                  <span className={`mini-badge ${update.healthReport?.vaccinesUpToDate ? 'yes' : 'no'}`}>
                    {update.healthReport?.vaccinesUpToDate ? '✅' : '❌'} Vaccines
                  </span>
                  <span className={`mini-badge ${update.healthReport?.vetVisited ? 'yes' : 'no'}`}>
                    {update.healthReport?.vetVisited ? '✅' : '❌'} Vet Visited
                  </span>
                </div>
                {update.additionalNotes && <p className="update-notes">"{update.additionalNotes}"</p>}
                <p className="update-date">Submitted: {new Date(update.submittedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )
      }

      {/* Review Modal */}
      {selected && (
        <div className="detail-panel-overlay" onClick={() => setSelected(null)}>
          <div className="detail-panel" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelected(null)}>✕</button>
            <h2>📋 Month {selected.month} Update — {selected.pet?.name}</h2>
            <p>👤 Customer: <strong>{selected.customer?.name}</strong> · {selected.customer?.email}</p>

            {selected.photos?.length > 0 && (
              <div className="update-photos">
                {selected.photos.map((p, i) => <img key={i} src={p} alt="" className="update-photo" />)}
              </div>
            )}

            <div className="detail-section"><h4>Health Report</h4>
              <ul>
                {selected.healthReport?.weight && <li>⚖️ Weight: {selected.healthReport.weight}</li>}
                <li>{selected.healthReport?.vetVisited ? '✅' : '❌'} Vet Visited</li>
                <li>{selected.healthReport?.vaccinesUpToDate ? '✅' : '❌'} Vaccines Up to Date</li>
                {selected.healthReport?.overallHealth && <li>🩺 Overall: <strong>{selected.healthReport.overallHealth}</strong></li>}
                {selected.healthReport?.vetNotes && <li>📝 Vet Notes: {selected.healthReport.vetNotes}</li>}
              </ul>
            </div>

            {selected.behaviorReport?.behaviorNotes && (
              <div className="detail-section"><h4>Behavior Notes</h4><p>{selected.behaviorReport.behaviorNotes}</p></div>
            )}
            {selected.additionalNotes && (
              <div className="detail-section"><h4>Additional Notes</h4><p>{selected.additionalNotes}</p></div>
            )}

            <div className="review-form">
              <h4>Your Review</h4>
              <label className="check-label">
                <input type="checkbox" checked={reviewForm.flagged}
                  onChange={e => setReviewForm({ ...reviewForm, flagged: e.target.checked })} />
                🚨 Flag this update for concern
              </label>
              {reviewForm.flagged && (
                <input placeholder="Reason for flagging..." value={reviewForm.flagReason}
                  onChange={e => setReviewForm({ ...reviewForm, flagReason: e.target.value })} />
              )}
              <textarea placeholder="Add your comment for the adopter..." rows={3}
                value={reviewForm.ngoComment}
                onChange={e => setReviewForm({ ...reviewForm, ngoComment: e.target.value })} />
              <button className="btn-primary" onClick={() => handleReview(selected._id)}>
                {reviewForm.flagged ? '🚨 Flag & Save' : '✅ Mark Reviewed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
