import { useState, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Emergency() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [locating, setLocating] = useState(false);
  const [photos, setPhotos] = useState([]);
  const fileRef = useRef();
  const [form, setForm] = useState({
    reporterName: '', reporterPhone: '', reporterEmail: '',
    animalType: 'dog', description: '', urgencyLevel: 'medium',
    lat: '', lng: '', address: '', landmark: ''
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const getLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        update('lat', pos.coords.latitude);
        update('lng', pos.coords.longitude);
        toast.success('📍 Location captured!');
        setLocating(false);
      },
      () => { toast.error('Location access denied. Please enter address manually.'); setLocating(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      photos.forEach(p => fd.append('photos', p));
      const res = await api.post('/emergency', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitted(res.data);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const urgencyConfig = {
    low: { color: '#22c55e', label: '🟢 Low — Not immediately life-threatening' },
    medium: { color: '#f59e0b', label: '🟡 Medium — Injured but stable' },
    high: { color: '#f97316', label: '🟠 High — Seriously injured, needs urgent help' },
    critical: { color: '#ef4444', label: '🔴 Critical — Life at immediate risk' }
  };

  return (
    <div className="emergency-page">
      <div className="emergency-hero">
        <div className="emergency-hero-content">
          <div className="emergency-badge">🚨 Emergency Report</div>
          <h1>Report an Animal in Distress</h1>
          <p>No login required. We'll immediately alert the nearest rescue NGO.</p>
        </div>
      </div>

      <div className="emergency-container">
        {/* Progress Steps */}
        <div className="progress-steps">
          {['Your Info', 'Animal & Location', 'Submitted'].map((label, i) => (
            <div key={i} className={`progress-step ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : ''}`}>
              <div className="step-circle">{step > i + 1 ? '✓' : i + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1 — Reporter Info */}
        {step === 1 && (
          <div className="emergency-form-card">
            <h2>Your Contact Information</h2>
            <p>This helps the NGO coordinate the rescue.</p>
            <div className="form-group">
              <label>Your Name *</label>
              <input value={form.reporterName} onChange={e => update('reporterName', e.target.value)} placeholder="Full name" required />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input type="tel" value={form.reporterPhone} onChange={e => update('reporterPhone', e.target.value)} placeholder="+91 9999999999" required />
            </div>
            <div className="form-group">
              <label>Email (optional)</label>
              <input type="email" value={form.reporterEmail} onChange={e => update('reporterEmail', e.target.value)} placeholder="your@email.com" />
            </div>
            <button className="btn-emergency btn-full"
              disabled={!form.reporterName || !form.reporterPhone}
              onClick={() => setStep(2)}>
              Next: Describe Animal →
            </button>
          </div>
        )}

        {/* Step 2 — Animal & Location */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="emergency-form-card">
            <h2>Animal & Location Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Animal Type *</label>
                <div className="animal-selector">
                  {['dog', 'cat', 'bird', 'other'].map(type => (
                    <button key={type} type="button"
                      className={`animal-type-btn ${form.animalType === type ? 'active' : ''}`}
                      onClick={() => update('animalType', type)}>
                      {type === 'dog' ? '🐶' : type === 'cat' ? '🐱' : type === 'bird' ? '🐦' : '🐾'}
                      <span>{type}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Urgency Level *</label>
              <div className="urgency-selector">
                {Object.entries(urgencyConfig).map(([key, cfg]) => (
                  <label key={key} className={`urgency-option ${form.urgencyLevel === key ? 'active' : ''}`}
                    style={{ borderColor: form.urgencyLevel === key ? cfg.color : '' }}>
                    <input type="radio" name="urgency" value={key} checked={form.urgencyLevel === key}
                      onChange={e => update('urgencyLevel', e.target.value)} />
                    {cfg.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Describe the Situation *</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)}
                placeholder="What happened? What condition is the animal in? Any visible injuries?" rows={4} required />
            </div>

            {/* Location */}
            <div className="location-section">
              <div className="location-header">
                <h4>📍 Location</h4>
                <button type="button" className="btn-gps" onClick={getLocation} disabled={locating}>
                  {locating ? '📡 Detecting...' : '📡 Use My GPS Location'}
                </button>
              </div>
              {form.lat && form.lng && (
                <div className="gps-captured">
                  ✅ GPS: {parseFloat(form.lat).toFixed(4)}, {parseFloat(form.lng).toFixed(4)}
                </div>
              )}
              <div className="form-group">
                <label>Street Address</label>
                <input value={form.address} onChange={e => update('address', e.target.value)}
                  placeholder="Street, area, city..." />
              </div>
              <div className="form-group">
                <label>Landmark / Description</label>
                <input value={form.landmark} onChange={e => update('landmark', e.target.value)}
                  placeholder="Near a park, behind the school, etc." />
              </div>
            </div>

            <div className="form-group">
              <label>Upload Photos (optional)</label>
              <div className="upload-area" onClick={() => fileRef.current.click()}>
                <span>📸 Add photos of the animal</span>
                <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                  onChange={e => setPhotos(Array.from(e.target.files))} />
              </div>
              {photos.length > 0 && <p className="file-count">✅ {photos.length} photo(s) selected</p>}
            </div>

            <div className="form-actions">
              <button type="button" className="btn-outline" onClick={() => setStep(1)}>← Back</button>
              <button type="submit" className="btn-emergency" disabled={submitting || !form.description}>
                {submitting ? '⏳ Sending Alert...' : '🚨 Send Emergency Alert'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3 — Confirmation */}
        {step === 3 && submitted && (
          <div className="emergency-success">
            <div className="success-icon">🎉</div>
            <h2>Alert Sent Successfully!</h2>
            <p>Your report has been received and an NGO has been notified.</p>
            {submitted.assignedNGO && (
              <div className="assigned-ngo-box">
                <h4>🏥 Assigned NGO:</h4>
                <p><strong>{submitted.assignedNGO.ngoDetails?.organizationName || submitted.assignedNGO.name}</strong></p>
                <p>📞 {submitted.assignedNGO.phone || 'Contact via email'}</p>
                <p>✉️ {submitted.assignedNGO.email}</p>
              </div>
            )}
            <p className="report-id">Report ID: <code>{submitted.report?._id}</code></p>
            <div className="success-actions">
              <button className="btn-primary" onClick={() => { setStep(1); setSubmitted(null); setForm({ reporterName: '', reporterPhone: '', reporterEmail: '', animalType: 'dog', description: '', urgencyLevel: 'medium', lat: '', lng: '', address: '', landmark: '' }); setPhotos([]); }}>
                Submit Another Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
