import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function LoginPage() {
  const [params] = useSearchParams();
  const next = params.get('next') || '/browse';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: setSession } = useAuth();
  const navigate = useNavigate();

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
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const auth = await login(email, password);
      setSession(auth);
      navigate(next);
    } catch (err: any) {
      setError(err?.response?.data || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">🌿 iTunda</div>
          <h1 className="auth-headline">Kenya's farm-to-fork marketplace</h1>
          <p className="auth-tagline">Connect directly with certified farmers across 47 counties</p>
          <div className="auth-features">
            {['1,000+ fresh produce listings','Real GPS farm locations','Export-ready certification','Live expiry tracking'].map(f => (
              <div key={f} className="auth-feature">✓ {f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your iTunda account</p>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="google-signin-wrap">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed. Please try again.')}
              width="100%"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          <div className="auth-divider"><span>or sign in with email</span></div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field-group">
              <label className="field-label">Email Address</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', borderRadius: 8, marginTop: 4 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider"><span>or try a demo account</span></div>

          <div className="demo-accounts">
            <button className="demo-btn" onClick={() => { setEmail('orders@nairobifresh.ke'); setPassword('Password123!'); }}>
              🏪 Buyer Demo
            </button>
            <button className="demo-btn" onClick={() => { setEmail('james.kamau@farm.ke'); setPassword('Password123!'); }}>
              🌾 Farmer Demo
            </button>
          </div>

          <p className="auth-switch">Don't have an account? <Link to={`/register?next=${encodeURIComponent(next)}`}>Sign up free →</Link></p>
        </div>
      </div>
    </div>
  );
}
