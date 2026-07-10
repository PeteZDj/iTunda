import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getMyFarmerProfile, getMyProduce, getFarmerOrders } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import type { FarmerResponse, ProduceResponse, OrderResponse } from '../types';
import './FarmerDashboardPage.css';

export default function FarmerDashboardPage() {
  const { isLoggedIn, role } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FarmerResponse | null>(null);
  const [listings, setListings] = useState<ProduceResponse[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [tab, setTab] = useState<'listings' | 'orders'>('listings');
  const [loading, setLoading] = useState(true);

  if (!isLoggedIn || role !== 'Farmer') return <Navigate to="/login?next=/dashboard" replace />;

  useEffect(() => {
    Promise.all([getMyFarmerProfile().catch(() => null), getFarmerOrders().catch(() => []), getMyProduce().catch(() => [])])
      .then(([p, o, mine]) => { setProfile(p); setOrders(o); setListings(mine); })
      .finally(() => setLoading(false));
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    Pending: 'badge-gray', Confirmed: 'badge-blue',
    InTransit: 'badge-accent', Delivered: 'badge-green', Cancelled: 'badge-red',
  };

  const live = listings.filter(l => !l.isDraft);
  const drafts = listings.filter(l => l.isDraft);

  return (
    <div className="dash-page">
      <aside className="dash-sidebar">
        {profile && (
          <div className="dash-profile">
            <div className="dash-avatar">{profile.imagePath ? <img src={profile.imagePath} alt="" /> : profile.name[0]}</div>
            <div className="dash-profile-name">{profile.farmName}</div>
            <div className="dash-profile-sub">by {profile.name}</div>
            <div className="dash-profile-stat">★ {profile.ratingFarmer.toFixed(1)} · {profile.ordersFulfilled} orders</div>
          </div>
        )}
        <nav className="dash-nav">
          {[
            { id: 'listings', label: '🌿 My Listings', count: listings.length },
            { id: 'orders', label: '📦 Orders', count: orders.length },
          ].map(({ id, label, count }) => (
            <button key={id} className={`dash-nav-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id as typeof tab)}>
              {label}<span className="dash-nav-count">{count}</span>
            </button>
          ))}
          <Link to="/sell" className="dash-nav-btn dash-nav-post">＋ Post Produce</Link>
        </nav>
        <div className="dash-side-links">
          <Link to="/account" className="btn btn-outline btn-sm dash-view-btn">Account & Profile →</Link>
          {profile && <Link to={`/farmers/${profile.id}`} className="btn btn-outline btn-sm dash-view-btn">View Public Profile →</Link>}
        </div>
      </aside>

      <main className="dash-main">
        {loading && <div className="spinner" />}

        {!loading && tab === 'listings' && (
          <div>
            <div className="dash-header">
              <h2 className="dash-title">My Listings</h2>
              <Link to="/sell" className="btn btn-amber btn-sm">+ Post New</Link>
            </div>

            {listings.length === 0 ? (
              <div className="dash-empty">
                <div style={{ fontSize: 40 }}>🌱</div>
                <h3>No listings yet</h3>
                <p>Start by posting your first produce listing.</p>
                <Link to="/sell" className="btn btn-amber" style={{ marginTop: 16 }}>Post Produce →</Link>
              </div>
            ) : (
              <>
                {drafts.length > 0 && (
                  <>
                    <h3 className="dash-subhead">Drafts · {drafts.length}</h3>
                    <div className="dash-listings-grid">
                      {drafts.map(item => <ListingCard key={item.id} item={item} format={format} onEdit={() => navigate(`/sell?edit=${item.id}`)} />)}
                    </div>
                  </>
                )}
                <h3 className="dash-subhead">Published · {live.length}</h3>
                <div className="dash-listings-grid">
                  {live.map(item => <ListingCard key={item.id} item={item} format={format} onEdit={() => navigate(`/sell?edit=${item.id}`)} />)}
                </div>
              </>
            )}
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
                          <span style={{ fontWeight: 700, color: 'var(--amber)' }}>{format(item.unitPriceAtOrder * item.quantity)}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>
                        <span>📍 {order.deliveryAddress} · {order.deliveryScope}</span>
                        <span>{format(order.totalAmount)}</span>
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

function ListingCard({ item, format, onEdit }: { item: ProduceResponse; format: (n: number) => string; onEdit: () => void; }) {
  return (
    <div className="dash-listing-card">
      <div className="dlc-top">
        <div>
          <div className="dlc-name">{item.name} {item.isDraft && <span className="badge badge-amber" style={{ fontSize: 10 }}>Draft</span>}</div>
          <div className="dlc-cat">{item.category}</div>
        </div>
        <div className="dlc-price">{format(item.price)}/{item.unit}</div>
      </div>
      <div className="dlc-meta">
        <span>📦 {item.quantityAvailable.toLocaleString()} {item.unit}</span>
        {item.expiryDate && <span>⏱ Exp {new Date(item.expiryDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</span>}
        {item.gradeQuality && <span className="badge badge-green" style={{ fontSize: 11 }}>{item.gradeQuality}</span>}
        {item.isExportReady && <span className="badge badge-amber" style={{ fontSize: 11 }}>✈ Export</span>}
      </div>
      <div className="dlc-actions">
        <button className="btn btn-outline btn-sm" onClick={onEdit}>{item.isDraft ? 'Edit & publish' : 'Edit'}</button>
        {!item.isDraft && <Link to={`/produce/${item.id}`} className="btn btn-text btn-sm">View</Link>}
      </div>
    </div>
  );
}
