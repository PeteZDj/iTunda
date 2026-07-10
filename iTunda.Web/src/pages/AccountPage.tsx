import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getMe, updateMe, getMyProduce, deleteProduce } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { categoryIcon } from '../lib/categories';
import { fileToDataUrl } from '../lib/image';
import type { MeResponse, ProduceResponse } from '../types';
import './AccountPage.css';

export default function AccountPage() {
  const { isLoggedIn, updateProfile } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'profile' | 'ads'>('profile');
  const [me, setMe] = useState<MeResponse | null>(null);
  const [ads, setAds] = useState<ProduceResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isLoggedIn) return <Navigate to="/login?next=/account" replace />;

  useEffect(() => {
    Promise.all([getMe(), getMyProduce()])
      .then(([m, a]) => {
        setMe(m); setName(m.name); setPhone(m.phone ?? ''); setAvatar(m.imagePath ?? null);
        setAds(a);
      })
      .catch(() => setErr('Could not load your account.'))
      .finally(() => setLoading(false));
  }, []);

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setAvatar(await fileToDataUrl(file, 256)); } catch { setErr('Could not read that image.'); }
    finally { e.target.value = ''; }
  };

  const saveProfile = async () => {
    setErr(''); setSavedMsg('');
    if (!name.trim()) { setErr('Name cannot be empty.'); return; }
    setSaving(true);
    try {
      const updated = await updateMe({ name: name.trim(), phone: phone.trim() || null, imagePath: avatar });
      setMe(updated);
      updateProfile({ name: updated.name, image: updated.imagePath });
      setSavedMsg('✓ Profile updated.');
    } catch { setErr('Could not save your profile.'); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    try { await deleteProduce(id); setAds(a => a.filter(x => x.id !== id)); }
    catch { setErr('Could not delete that listing.'); }
  };

  const initial = (name || me?.name || '?').trim()[0]?.toUpperCase() ?? '?';
  const drafts = ads.filter(a => a.isDraft);
  const live = ads.filter(a => !a.isDraft);

  return (
    <div className="acct-page page-container">
      <header className="acct-head">
        <div className="acct-id">
          <div className="acct-avatar">{avatar ? <img src={avatar} alt="" /> : initial}</div>
          <div>
            <h1>{me?.name ?? 'My account'}</h1>
            <span className="acct-sub">{me?.email} · {me?.role}</span>
          </div>
        </div>
        <Link to="/sell" className="btn btn-buy">＋ Post a listing</Link>
      </header>

      <div className="acct-tabs">
        <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>Profile</button>
        <button className={tab === 'ads' ? 'active' : ''} onClick={() => setTab('ads')}>
          My Ads <span className="acct-tab-count">{ads.length}</span>
        </button>
      </div>

      {err && <div className="alert alert-error">{err}</div>}
      {loading && <div className="spinner" />}

      {!loading && tab === 'profile' && (
        <div className="acct-card card">
          {savedMsg && <div className="alert alert-success">{savedMsg}</div>}
          <div className="acct-avatar-edit">
            <div className="acct-avatar lg">{avatar ? <img src={avatar} alt="" /> : initial}</div>
            <div>
              <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>Change photo</button>
              {avatar && <button className="btn btn-text btn-sm" onClick={() => setAvatar(null)}>Remove</button>}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatar} />
              <p className="acct-hint">A square photo works best.</p>
            </div>
          </div>

          <div className="form-row-2">
            <div className="field-group">
              <label className="field-label">Full name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Phone</label>
              <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Email</label>
            <input className="input" value={me?.email ?? ''} disabled />
          </div>

          <div className="acct-save-row">
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {me?.hasFarmerProfile && (
              <Link to="/dashboard" className="btn btn-outline">Farm profile & orders →</Link>
            )}
          </div>
        </div>
      )}

      {!loading && tab === 'ads' && (
        <div className="acct-ads">
          {ads.length === 0 && (
            <div className="acct-empty card">
              <div style={{ fontSize: 42 }}>🌱</div>
              <h3>No listings yet</h3>
              <p>Post your produce to start selling on the exchange.</p>
              <Link to="/sell" className="btn btn-buy" style={{ marginTop: 12 }}>＋ Post a listing</Link>
            </div>
          )}

          {drafts.length > 0 && (
            <>
              <h3 className="acct-section">Drafts <span>{drafts.length}</span></h3>
              <div className="acct-grid">
                {drafts.map(a => <AdCard key={a.id} ad={a} format={format} onEdit={() => navigate(`/sell?edit=${a.id}`)} onDelete={() => remove(a.id)} />)}
              </div>
            </>
          )}

          {live.length > 0 && (
            <>
              <h3 className="acct-section">Published <span>{live.length}</span></h3>
              <div className="acct-grid">
                {live.map(a => <AdCard key={a.id} ad={a} format={format} onEdit={() => navigate(`/sell?edit=${a.id}`)} onDelete={() => remove(a.id)} />)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AdCard({ ad, format, onEdit, onDelete }: {
  ad: ProduceResponse; format: (n: number) => string; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className={`acct-ad ${ad.isDraft ? 'draft' : ''}`}>
      <div className="acct-ad-img">
        <img src={ad.imageUrl} alt={ad.name} loading="lazy" />
        {ad.isDraft
          ? <span className="acct-badge draft">Draft</span>
          : <span className="acct-badge live">Live</span>}
        <span className="acct-scope">{ad.deliveryScope === 'Export' ? '✈ Export' : ad.deliveryScope === 'Both' ? '🌍 Local+Export' : '🏠 Local'}</span>
      </div>
      <div className="acct-ad-body">
        <div className="acct-ad-title">{categoryIcon(ad.category)} {ad.name}</div>
        <div className="acct-ad-meta">{format(ad.price)}/{ad.unit} · {ad.quantityAvailable.toLocaleString()} {ad.unit}</div>
        <div className="acct-ad-actions">
          <button className="btn btn-outline btn-sm" onClick={onEdit}>{ad.isDraft ? 'Edit & publish' : 'Edit'}</button>
          {!ad.isDraft && <Link to={`/produce/${ad.id}`} className="btn btn-text btn-sm">View</Link>}
          <button className="btn btn-text btn-sm danger" onClick={onDelete}>Delete</button>
        </div>
      </div>
    </div>
  );
}
