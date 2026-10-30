import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function MonthlyUpdates() {
  const { adoptionId } = useParams();
  const [updates, setUpdates] = useState([]);
  const [adoption, setAdoption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [month, setMonth] = useState(1);
  const [healthReport, setHealthReport] = useState({ weight: '', vetVisited: false, vetNotes: '', vaccinesUpToDate: false, overallHealth: 'good' });
  const [behaviorReport, setBehaviorReport] = useState({ isHappy: true, behaviorNotes: '', trainingProgress: '' });
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([
      api.get(`/updates/adoption/${adoptionId}`),
      api.get(`/adoptions/${adoptionId}`)
    ]).then(([updRes, adoptRes]) => {
      setUpdates(updRes.data.updates);
      setAdoption(adoptRes.data.adoption);
      // Auto-select next month
      const submitted = updRes.data.updates.map(u => u.month);
      const next = [1, 2, 3].find(m => !submitted.includes(m));
      if (next) setMonth(next);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [adoptionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('adoptionId', adoptionId);
      fd.append('month', month);
      fd.append('healthReport', JSON.stringify(healthReport));
      fd.append('behaviorReport', JSON.stringify(behaviorReport));
      fd.append('additionalNotes', additionalNotes);
      photos.forEach(p => fd.append('photos', p));

      await api.post('/updates', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`✅ Month ${month} update submitted!`);
      const res = await api.get(`/updates/adoption/${adoptionId}`);
      setUpdates(res.data.updates);
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const submittedMonths = updates.map(u => u.month);
  const healthColor = { excellent: '#22c55e', good: '#84cc16', fair: '#f59e0b', poor: '#ef4444' };

  if (loading) return <div className="page-loading"><div className="spinner"></div><p>Loading...</p></div>;

  return (
    <div className="updates-page">
      <div className="dashboard-header">
        <div>
          <h1>Monthly Health Updates</h1>
          {adoption?.pet && <p>For: <strong>{adoption.pet.name}</strong> ({adoption.pet.species})</p>}
          <p>Submit monthly reports for 3 months to complete your adoption journey</p>
        </div>
        {submittedMonths.length < 3 && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : `+ Month ${month} Update`}
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="month-timeline">
        {[1, 2, 3].map(m => {
          const update = updates.find(u => u.month === m);
          return (
            <div key={m} className={`month-node ${update ? 'done' : m === month && !showForm ? 'current' : 'pending'}`}>
              <div className="month-circle">
                {update ? '✅' : m === month ? '📝' : '○'}
              </div>
              <div className="month-label">
                <strong>Month {m}</strong>
                {update ? (
                  <span className="month-status submitted">
                    Submitted {new Date(update.submittedAt).toLocaleDateString()}
                    {update.ngoReview?.flagged && <span className="flag-indicator"> 🚨</span>}
                    {update.ngoReview?.reviewed && !update.ngoReview?.flagged && <span className="ok-indicator"> ✅ Reviewed</span>}
                  </span>
                ) : (
                  <span className="month-status pending">Not submitted</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Review feedback from NGO */}
      {updates.some(u => u.ngoReview?.ngoComment) && (
        <div className="ngo-feedback-section">
          <h3>💬 NGO Feedback</h3>
          {updates.filter(u => u.ngoReview?.ngoComment).map(u => (
            <div key={u._id} className={`ngo-comment ${u.ngoReview.flagged ? 'flagged' : ''}`}>
              <span className="month-badge">Month {u.month}</span>
              {u.ngoReview.flagged && <span className="flag-badge">🚨 Concern Raised</span>}
              <p>{u.ngoReview.ngoComment}</p>
              {u.ngoReview.flagReason && <p className="flag-reason">Reason: {u.ngoReview.flagReason}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Submission Form */}
      {showForm && submittedMonths.length < 3 && (
        <div className="form-panel">
          <h2>📋 Month {month} Update</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-section-title">🏥 Health Report</div>
            <div className="form-row">
              <div className="form-group">
                <label>Current Weight</label>
                <input placeholder="e.g. 5.2 kg" value={healthReport.weight}
                  onChange={e => setHealthReport({ ...healthReport, weight: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Overall Health *</label>
                <select value={healthReport.overallHealth}
                  onChange={e => setHealthReport({ ...healthReport, overallHealth: e.target.value })}>
                  {['excellent', 'good', 'fair', 'poor'].map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div className="check-row">
              <label className="check-label">
                <input type="checkbox" checked={healthReport.vetVisited}
                  onChange={e => setHealthReport({ ...healthReport, vetVisited: e.target.checked })} />
                🏥 Vet visited this month
              </label>
              <label className="check-label">
                <input type="checkbox" checked={healthReport.vaccinesUpToDate}
                  onChange={e => setHealthReport({ ...healthReport, vaccinesUpToDate: e.target.checked })} />
                💉 Vaccines up to date
              </label>
            </div>
            {healthReport.vetVisited && (
              <div className="form-group">
                <label>Vet Notes</label>
                <textarea placeholder="What did the vet say?" value={healthReport.vetNotes}
                  onChange={e => setHealthReport({ ...healthReport, vetNotes: e.target.value })} rows={2} />
              </div>
            )}
            <div className="form-section-title">🐾 Behavior Report</div>
            <div className="form-group">
              <label>Behavior Notes</label>
              <textarea placeholder="How is the pet adjusting? Any behavioral changes?" value={behaviorReport.behaviorNotes}
                onChange={e => setBehaviorReport({ ...behaviorReport, behaviorNotes: e.target.value })} rows={3} />
            </div>
            <div className="form-group">
              <label>Training Progress</label>
              <input placeholder="Any training milestones?" value={behaviorReport.trainingProgress}
                onChange={e => setBehaviorReport({ ...behaviorReport, trainingProgress: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Additional Notes</label>
              <textarea placeholder="Anything else to share with the NGO?" value={additionalNotes}
                onChange={e => setAdditionalNotes(e.target.value)} rows={3} />
            </div>
            <div className="form-group">
              <label>Photos of your pet 📸</label>
              <div className="upload-area" onClick={() => fileRef.current.click()}>
                <span>📸 Upload photos (max 5)</span>
                <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                  onChange={e => setPhotos(Array.from(e.target.files))} />
              </div>
              {photos.length > 0 && <p className="file-count">✅ {photos.length} photo(s) selected</p>}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? '⏳ Submitting...' : '📤 Submit Month Update'}
              </button>
              <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {submittedMonths.length === 3 && (
        <div className="completion-banner">
          <div className="completion-icon">🎉</div>
          <h2>Monitoring Complete!</h2>
          <p>You've successfully completed all 3 months of post-adoption monitoring. Thank you for being a responsible pet owner!</p>
        </div>
      )}
    </div>
  );
}
