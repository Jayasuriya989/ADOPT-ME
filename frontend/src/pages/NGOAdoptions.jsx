import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STATUS_TABS = ['all', 'application', 'declaration-pending', 'trial', 'permanently-adopted', 'returned', 'rejected'];

export default function NGOAdoptions() {
  const [adoptions, setAdoptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selected, setSelected] = useState(null);

  const fetchAdoptions = async () => {
    setLoading(true);
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const res = await api.get('/adoptions/ngo', { params });
      setAdoptions(res.data.adoptions);
    } catch { toast.error('Failed to load adoptions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAdoptions(); }, [activeTab]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/adoptions/${id}/approve`, { ngoNotes: 'Application approved. Please sign the digital declaration.' });
      toast.success('Application approved! ✅');
      fetchAdoptions(); setSelected(null);
    } catch { toast.error('Failed to approve'); }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await api.put(`/adoptions/${id}/reject`, { ngoNotes: reason });
      toast.success('Application rejected');
      fetchAdoptions(); setSelected(null);
    } catch { toast.error('Failed to reject'); }
  };

  const handleCompleteTrial = async (id) => {
    if (!confirm('Mark this adoption as permanently completed?')) return;
    try {
      await api.put(`/adoptions/${id}/complete-trial`);
      toast.success('🎉 Adoption permanently completed!');
      fetchAdoptions(); setSelected(null);
    } catch { toast.error('Failed'); }
  };

  const statusColors = {
    application: '#6366f1', 'declaration-pending': '#f59e0b', trial: '#3b82f6',
    'permanently-adopted': '#22c55e', returned: '#ef4444', rejected: '#9ca3af'
  };

  const getTrialDaysLeft = (endDate) => {
    if (!endDate) return null;
    const diff = new Date(endDate) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div><h1>Adoption Requests</h1><p>Manage and review all adoption applications</p></div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {STATUS_TABS.map(tab => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}>
            {tab === 'all' ? 'All' : tab.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            {tab !== 'all' && <span className="tab-count">{adoptions.filter(a => a.status === tab).length || ''}</span>}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner-center"><div className="spinner"></div></div>
        : adoptions.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><h3>No adoptions yet</h3></div>
        ) : (
          <div className="adoptions-list">
            {adoptions.map(adoption => (
              <div key={adoption._id} className="adoption-card" onClick={() => setSelected(selected?._id === adoption._id ? null : adoption)}>
                <div className="adoption-card-left">
                  {adoption.pet?.images?.[0] && <img src={adoption.pet.images[0]} alt="" className="adopt-thumb" />}
                  <div>
                    <h3>{adoption.pet?.name} <span className="species-tag">{adoption.pet?.species}</span></h3>
                    <p>👤 {adoption.customer?.name} · {adoption.customer?.email}</p>
                    <p>📞 {adoption.customer?.phone || 'No phone'}</p>
                    {adoption.applicationNotes && <p className="app-notes">"{adoption.applicationNotes}"</p>}
                  </div>
                </div>
                <div className="adoption-card-right">
                  <span className="status-pill" style={{ background: statusColors[adoption.status] }}>
                    {adoption.status.replace('-', ' ')}
                  </span>
                  {adoption.status === 'trial' && adoption.trial?.endDate && (
                    <span className="trial-timer">⏱️ {getTrialDaysLeft(adoption.trial.endDate)}d left</span>
                  )}
                  <span className="adoption-date">{new Date(adoption.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Detail Panel */}
      {selected && (
        <div className="detail-panel-overlay" onClick={() => setSelected(null)}>
          <div className="detail-panel" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelected(null)}>✕</button>
            <h2>📋 Application Details</h2>

            <div className="detail-section">
              <h4>Pet</h4>
              <p>{selected.pet?.name} ({selected.pet?.species})</p>
            </div>
            <div className="detail-section">
              <h4>Applicant</h4>
              <p>{selected.customer?.name} · {selected.customer?.email} · {selected.customer?.phone}</p>
            </div>
            {selected.applicationNotes && (
              <div className="detail-section"><h4>Application Notes</h4><p>{selected.applicationNotes}</p></div>
            )}
            {selected.declaration?.signed && (
              <div className="detail-section declaration-box">
                <h4>✅ Declaration Signed</h4>
                <p><strong>By:</strong> {selected.declaration.customerName}</p>
                <p><strong>Address:</strong> {selected.declaration.customerAddress}</p>
                <p><strong>Signed:</strong> {new Date(selected.declaration.signedAt).toLocaleString()}</p>
                <details><summary>View Agreement Text</summary><pre>{selected.declaration.agreementText}</pre></details>
              </div>
            )}
            {selected.trial?.startDate && (
              <div className="detail-section trial-box">
                <h4>⏳ Trial Period</h4>
                <p>Started: {new Date(selected.trial.startDate).toLocaleDateString()}</p>
                <p>Ends: {new Date(selected.trial.endDate).toLocaleDateString()}</p>
                <p>Status: {selected.trial.status}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="detail-actions">
              {selected.status === 'application' && (
                <>
                  <button className="btn-primary" onClick={() => handleApprove(selected._id)}>✅ Approve</button>
                  <button className="btn-danger" onClick={() => handleReject(selected._id)}>❌ Reject</button>
                </>
              )}
              {selected.status === 'trial' && (
                <button className="btn-primary" onClick={() => handleCompleteTrial(selected._id)}>
                  🎉 Mark Permanently Adopted
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
