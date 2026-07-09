import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders, getFarmerOrders } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import type { OrderResponse } from '../types';
import './OrdersPage.css';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'badge-gray', Confirmed: 'badge-blue',
  InTransit: 'badge-accent', Delivered: 'badge-green', Cancelled: 'badge-red',
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function OrdersPage() {
  const { role, isLoggedIn } = useAuth();
  const { format } = useCurrency();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) return;
    const fn = role === 'Farmer' ? getFarmerOrders : getMyOrders;
    fn().then(setOrders).catch(e => setError(e?.response?.data || 'Failed to load orders.')).finally(() => setLoading(false));
  }, [role, isLoggedIn]);

  if (!isLoggedIn) return (
    <div className="page-container" style={{ padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2>Sign in to view your orders</h2>
      <Link to="/login" className="btn btn-primary" style={{ marginTop: 20 }}>Sign In</Link>
    </div>
  );

  return (
    <div className="page-container" style={{ padding: '32px 24px' }}>
      <div className="orders-header">
        <h1 className="orders-title">{role === 'Farmer' ? 'Incoming Orders' : 'My Orders'}</h1>
        <Link to="/browse" className="btn btn-amber btn-sm">+ Browse Produce</Link>
      </div>

      {loading && <div className="spinner" />}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 48 }}>📦</div>
          <h3 style={{ marginTop: 12 }}>No orders yet</h3>
          <Link to="/browse" className="btn btn-primary" style={{ marginTop: 20 }}>Browse Produce →</Link>
        </div>
      )}

      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-card-header">
              <div>
                <span className="order-id">Order #{order.id}</span>
                <span className="order-date">{fmt(order.createdAt)}</span>
              </div>
              <span className={`badge ${STATUS_COLORS[order.status] ?? 'badge-gray'}`}>{order.status}</span>
            </div>

            <div className="order-items">
              {order.items.map((item, i) => (
                <div key={i} className="order-item-row">
                  <span className="order-item-name">{item.produceName}</span>
                  <span className="order-item-qty">× {item.quantity.toLocaleString()}</span>
                  <span className="order-item-price">{format(item.unitPriceAtOrder * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="order-footer">
              {order.deliveryAddress && (
                <span className="order-address">📍 {order.deliveryAddress}</span>
              )}
              <span className="order-total">Total: {format(order.totalAmount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
