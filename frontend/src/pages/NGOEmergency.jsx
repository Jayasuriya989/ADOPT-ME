import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const urgencyColor = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
const statusColor = { pending: '#9ca3af', assigned: '#6366f1', 'in-progress': '#f59e0b', resolved: '#22c55e', closed: '#374151' };

export default function NGOEmergency() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', ngoResponse: '', resolutionNotes: '' });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/emergency');
      setReports(res.data.reports);
    } catch { toast.error('Failed to load emergency reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleStatusUpdate = async (id) => {
    try {
      await api.put(`/emergency/${id}/status`, statusUpdate);
      toast.success('Report updated ✅');
      setSelected(null);
      fetchReports();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>🚨 Emergency Reports</h1>
          <p>Animal distress reports assigned to your NGO</p>
        </div>
        <div className="stats-inline">
          <span className="badge-stat pending">{reports.filter(r => r.status === 'pending' || r.status === 'assigned').length} Active</span>
          <span className="badge-stat resolved">{reports.filter(r => r.status === 'resolved').length} Resolved</span>
        </div>
      </div>

      {loading ? <div className="spinner-center"><div className="spinner"></div></div>
        : reports.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🚨</div><h3>No emergency reports</h3><p>Reports assigned to your NGO will appear here.</p></div>
        ) : (
          <div className="emergency-list">
            {reports.map(report => (
              <div key={report._id} className={`emergency-card urgency-${report.urgencyLevel}`}
                onClick={() => { setSelected(report); setStatusUpdate({ status: report.status, ngoResponse: report.ngoResponse || '', resolutionNotes: report.resolutionNotes || '' }); }}>
                <div className="emergency-card-top">
                  <div className="emergency-animal">
                    <span className="animal-emoji">{report.animalType === 'dog' ? '🐶' : report.animalType === 'cat' ? '🐱' : report.animalType === 'bird' ? '🐦' : '🐾'}</span>
                    <div>
                      <h3>{report.animalType.charAt(0).toUpperCase() + report.animalType.slice(1)} in Distress</h3>
                      <p>Reported by: {report.reporterName} · {report.reporterPhone}</p>
                    </div>
                  </div>
                  <div className="emergency-badges">
                    <span className="urgency-pill" style={{ background: urgencyColor[report.urgencyLevel] }}>
                      {report.urgencyLevel.toUpperCase()}
                    </span>
                    <span className="status-pill" style={{ background: statusColor[report.status] }}>
                      {report.status}
                    </span>
                  </div>
                </div>
                <p className="emergency-desc">{report.description}</p>
                {report.location?.address && <p className="emergency-location">📍 {report.location.address}</p>}
                {report.location?.landmark && <p className="emergency-location">🏷️ {report.location.landmark}</p>}
                {report.location?.coordinates?.length === 2 && (
                  <a href={`https://www.google.com/maps?q=${report.location.coordinates[1]},${report.location.coordinates[0]}`}
                    target="_blank" rel="noreferrer" className="map-link" onClick={e => e.stopPropagation()}>
                    🗺️ View on Map
                  </a>
                )}
                <p className="emergency-time">🕒 {new Date(report.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )
      }

      {/* Detail/Update Modal */}
      {selected && (
        <div className="detail-panel-overlay" onClick={() => setSelected(null)}>
          <div className="detail-panel" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelected(null)}>✕</button>
            <h2>🚨 Emergency Report</h2>
            <div className="detail-section">
              <h4>Animal & Location</h4>
              <p>Type: <strong>{selected.animalType}</strong></p>
              <p>Description: {selected.description}</p>
              {selected.location?.address && <p>📍 {selected.location.address}</p>}
              {selected.location?.landmark && <p>🏷️ Near: {selected.location.landmark}</p>}
              {selected.location?.coordinates?.length === 2 && (
                <a href={`https://www.google.com/maps?q=${selected.location.coordinates[1]},${selected.location.coordinates[0]}`}
                  target="_blank" rel="noreferrer" className="map-link">🗺️ Open in Google Maps</a>
              )}
            </div>
            <div className="detail-section">
              <h4>Reporter Details</h4>
              <p>Name: {selected.reporterName}</p>
              <p>Phone: <a href={`tel:${selected.reporterPhone}`}>{selected.reporterPhone}</a></p>
              {selected.reporterEmail && <p>Email: {selected.reporterEmail}</p>}
            </div>
            {selected.photos?.length > 0 && (
              <div className="update-photos">
                {selected.photos.map((p, i) => <img key={i} src={p} alt="" className="update-photo" />)}
              </div>
            )}
            <div className="review-form">
              <h4>Update Status</h4>
              <select value={statusUpdate.status} onChange={e => setStatusUpdate({ ...statusUpdate, status: e.target.value })}>
                {['pending', 'assigned', 'in-progress', 'resolved', 'closed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea placeholder="Response / action taken..." rows={3}
                value={statusUpdate.ngoResponse}
                onChange={e => setStatusUpdate({ ...statusUpdate, ngoResponse: e.target.value })} />
              {statusUpdate.status === 'resolved' && (
                <textarea placeholder="Resolution notes..." rows={2}
                  value={statusUpdate.resolutionNotes}
                  onChange={e => setStatusUpdate({ ...statusUpdate, resolutionNotes: e.target.value })} />
              )}
              <button className="btn-primary" onClick={() => handleStatusUpdate(selected._id)}>💾 Save Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
