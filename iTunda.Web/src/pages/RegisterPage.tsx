import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function RegisterPage() {
  const [params] = useSearchParams();
  const next = params.get('next') || '/browse';
  const [form, setForm] = useState({ name: params.get('name') ?? '', email: '', phone: '', password: '', role: 1 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: setSession } = useAuth();
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: k === 'role' ? Number(e.target.value) : e.target.value }));

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/gauth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setSession({ token: data.token, userId: 0, name: data.user.name, email: data.user.email, role: 'Buyer', imagePath: data.user.avatar });
      navigate(next);
    } catch {
      setError('Google sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Please fill in all required fields.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const auth = await register(form);
      setSession(auth);
      navigate(next);
    } catch (err: any) {
      setError(err?.response?.data || 'Registration failed. Try a different email.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">🌿 iTunda</div>
          <h1 className="auth-headline">Join the global farm-to-fork exchange</h1>
          <p className="auth-tagline">Whether you grow it or source it — iTunda connects you</p>
          <div className="auth-features">
            {['Free to join','Post unlimited listings as a Farmer','Buy, bid & trade futures across 4 export zones','Delivery routing & tracking built-in'].map(f => (
              <div key={f} className="auth-feature">✓ {f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Free forever. No credit card needed.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="google-signin-wrap">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-up failed. Please try again.')}
              width="100%"
              text="signup_with"
              shape="rectangular"
            />
          </div>

          <div className="auth-divider"><span>or sign up with email</span></div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field-group">
              <label className="field-label">I am a *</label>
              <select className="select" value={form.role} onChange={set('role')}>
                <option value={1}>Buyer (Restaurant / Store / Exporter)</option>
                <option value={0}>Farmer</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Full Name *</label>
              <input className="input" type="text" value={form.name} onChange={set('name')} placeholder="James Kamau" />
            </div>
            <div className="field-group">
              <label className="field-label">Email Address *</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            </div>
            <div className="field-group">
              <label className="field-label">Phone Number</label>
              <input className="input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+254 7XX XXX XXX" />
            </div>
            <div className="field-group">
              <label className="field-label">Password *</label>
              <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" />
            </div>
            <button className="btn btn-amber" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', borderRadius: 8, marginTop: 4 }}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p className="auth-switch">Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`}>Sign in →</Link></p>
        </div>
      </div>
    </div>
  );
}
