import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getMyFarmerProfile, getMyListings, createProduce, getFarmerOrders } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { FarmerResponse, ProduceResponse, OrderResponse } from '../types';
import './FarmerDashboardPage.css';

const CATEGORIES = [
  'Avocados','Macadamia Nuts','French Beans','Tea','Peas & Mange Tout',
  'Passion Fruit','Mangoes','Bananas','Tomatoes','Onions','Capsicum & Peppers','Roses',
];

export default function FarmerDashboardPage() {
  const { isLoggedIn, role } = useAuth();
  const [profile, setProfile] = useState<FarmerResponse | null>(null);
  const [listings, setListings] = useState<ProduceResponse[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [tab, setTab] = useState<'listings' | 'add' | 'orders'>('listings');
  const [loading, setLoading] = useState(true);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitErr, setSubmitErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '', category: '', description: '', price: '', unit: 'kg',
    quantityAvailable: '', gradeQuality: '', expiryDate: '', availableFrom: '',
    isExportReady: false,
  });

  if (!isLoggedIn || role !== 'Farmer') return <Navigate to="/login" replace />;

  useEffect(() => {
    Promise.all([getMyFarmerProfile(), getFarmerOrders()])
      .then(([p, o]) => {
        setProfile(p);
        setOrders(o);
        return getMyListings(p.id);
      })
      .then(setListings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: k === 'isExportReady' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg(''); setSubmitErr('');
    if (!form.name || !form.category || !form.price || !form.quantityAvailable) {
      setSubmitErr('Please fill in all required fields.'); return;
    }
    setSubmitting(true);
    try {
      await createProduce({
        ...form,
        price: parseFloat(form.price),
        quantityAvailable: parseFloat(form.quantityAvailable),
        expiryDate: form.expiryDate || null,
        availableFrom: form.availableFrom || null,
        gradeQuality: form.gradeQuality || null,
      });
      setSubmitMsg('✓ Listing posted successfully!');
      setForm({ name: '', category: '', description: '', price: '', unit: 'kg', quantityAvailable: '', gradeQuality: '', expiryDate: '', availableFrom: '', isExportReady: false });
      if (profile) getMyListings(profile.id).then(setListings);
      setTab('listings');
    } catch (err: any) {
      setSubmitErr(err?.response?.data || 'Failed to post listing.');
    } finally { setSubmitting(false); }
  };

  const STATUS_COLORS: Record<string, string> = {
    Pending: 'badge-gray', Confirmed: 'badge-blue',
    InTransit: 'badge-accent', Delivered: 'badge-green', Cancelled: 'badge-red',
  };

  return (
    <div className="dash-page">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        {profile && (
          <div className="dash-profile">
            <div className="dash-avatar">{profile.name[0]}</div>
            <div className="dash-profile-name">{profile.farmName}</div>
            <div className="dash-profile-sub">by {profile.name}</div>
            <div className="dash-profile-stat">★ {profile.ratingFarmer.toFixed(1)} · {profile.ordersFulfilled} orders</div>
          </div>
        )}
        <nav className="dash-nav">
          {[
            { id: 'listings', label: '🌿 My Listings', count: listings.length },
            { id: 'add', label: '＋ Post Produce', count: null },
            { id: 'orders', label: '📦 Orders', count: orders.length },
          ].map(({ id, label, count }) => (
            <button key={id} className={`dash-nav-btn ${tab === id ? 'active' : ''}`}
              onClick={() => setTab(id as typeof tab)}>
              {label}
              {count !== null && <span className="dash-nav-count">{count}</span>}
            </button>
          ))}
        </nav>
        {profile && (
          <Link to={`/farmers/${profile.id}`} className="btn btn-outline btn-sm dash-view-btn">
            View Public Profile →
          </Link>
        )}
      </aside>

      {/* Main */}
      <main className="dash-main">
        {loading && <div className="spinner" />}

        {!loading && tab === 'listings' && (
          <div>
            <div className="dash-header">
              <h2 className="dash-title">My Listings</h2>
              <button className="btn btn-amber btn-sm" onClick={() => setTab('add')}>+ Post New</button>
            </div>
            {listings.length === 0 ? (
              <div className="dash-empty">
                <div style={{ fontSize: 40 }}>🌱</div>
                <h3>No listings yet</h3>
                <p>Start by posting your first produce listing.</p>
                <button className="btn btn-amber" style={{ marginTop: 16 }} onClick={() => setTab('add')}>Post Produce →</button>
              </div>
            ) : (
              <div className="dash-listings-grid">
                {listings.map(item => (
                  <Link key={item.id} to={`/produce/${item.id}`} className="dash-listing-card">
                    <div className="dlc-top">
                      <div>
                        <div className="dlc-name">{item.name}</div>
                        <div className="dlc-cat">{item.category}</div>
                      </div>
                      <div className="dlc-price">KES {item.price.toLocaleString()}/{item.unit}</div>
                    </div>
                    <div className="dlc-meta">
                      <span>📦 {item.quantityAvailable.toLocaleString()} {item.unit}</span>
                      {item.expiryDate && <span>⏱ Exp {new Date(item.expiryDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</span>}
                      {item.gradeQuality && <span className="badge badge-green" style={{ fontSize: 11 }}>{item.gradeQuality}</span>}
                      {item.isExportReady && <span className="badge badge-amber" style={{ fontSize: 11 }}>✈ Export</span>}
                    </div>
                    {item.availableFrom && new Date(item.availableFrom) > new Date() && (
                      <div className="dlc-scheduled">🕐 Scheduled: {new Date(item.availableFrom).toLocaleDateString('en-KE')}</div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && tab === 'add' && (
          <div className="dash-form-wrap">
            <h2 className="dash-title">Post New Produce</h2>
            {submitMsg && <div className="alert alert-success">{submitMsg}</div>}
            {submitErr && <div className="alert alert-error">{submitErr}</div>}
            <form onSubmit={handleAdd} className="dash-form card">
              <div className="form-row-2">
                <div className="field-group">
                  <label className="field-label">Produce Name *</label>
                  <input className="input" value={form.name} onChange={setF('name')} placeholder="e.g. Hass Avocado" />
                </div>
                <div className="field-group">
                  <label className="field-label">Category *</label>
                  <select className="select" value={form.category} onChange={setF('category')}>
                    <option value="">Select category…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row-3">
                <div className="field-group">
                  <label className="field-label">Price (KES) *</label>
                  <input className="input" type="number" min="1" value={form.price} onChange={setF('price')} placeholder="0.00" />
                </div>
                <div className="field-group">
                  <label className="field-label">Unit</label>
                  <select className="select" value={form.unit} onChange={setF('unit')}>
                    <option value="kg">kg</option>
                    <option value="bunch">bunch</option>
                    <option value="stem">stem</option>
                    <option value="tonne">tonne</option>
                    <option value="crate">crate</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Quantity Available *</label>
                  <input className="input" type="number" min="1" value={form.quantityAvailable} onChange={setF('quantityAvailable')} placeholder="0" />
                </div>
              </div>
              <div className="form-row-2">
                <div className="field-group">
                  <label className="field-label">Expiry Date</label>
                  <input className="input" type="date" value={form.expiryDate} onChange={setF('expiryDate')} />
                </div>
                <div className="field-group">
                  <label className="field-label">Available From (schedule)</label>
                  <input className="input" type="date" value={form.availableFrom} onChange={setF('availableFrom')} />
                </div>
              </div>
              <div className="form-row-2">
                <div className="field-group">
                  <label className="field-label">Grade / Quality</label>
                  <input className="input" value={form.gradeQuality} onChange={setF('gradeQuality')} placeholder="e.g. Grade A, Export Grade" />
                </div>
                <div className="field-group" style={{ justifyContent: 'flex-end', paddingBottom: 4 }}>
                  <label className="field-label">Export Ready</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 15, marginTop: 8 }}>
                    <input type="checkbox" checked={form.isExportReady} onChange={setF('isExportReady')} style={{ width: 18, height: 18, accentColor: 'var(--amber)' }} />
                    ✈ Mark as export ready
                  </label>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Description</label>
                <textarea className="input textarea" value={form.description} onChange={setF('description')} placeholder="Describe your produce — variety, growing conditions, usage…" rows={4} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-amber" type="submit" disabled={submitting} style={{ flex: 1, justifyContent: 'center', borderRadius: 8 }}>
                  {submitting ? 'Posting…' : '🌿 Post Listing'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setTab('listings')} style={{ borderRadius: 8 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!loading && tab === 'orders' && (
          <div>
            <h2 className="dash-title">Incoming Orders</h2>
            {orders.length === 0 ? (
              <div className="dash-empty"><div style={{ fontSize: 40 }}>📦</div><h3>No orders yet</h3></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {orders.map(order => (
                  <div key={order.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ background: 'var(--primary)', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#fff', fontWeight: 800 }}>Order #{order.id}</span>
                      <span className={`badge ${STATUS_COLORS[order.status] ?? 'badge-gray'}`}>{order.status}</span>
                    </div>
                    <div style={{ padding: '14px 18px' }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5', fontSize: 14 }}>
                          <span>{item.produceName} × {item.quantity}</span>
                          <span style={{ fontWeight: 700, color: 'var(--amber)' }}>KES {(item.unitPriceAtOrder * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>
                        <span>📍 {order.deliveryAddress}</span>
                        <span>KES {order.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
