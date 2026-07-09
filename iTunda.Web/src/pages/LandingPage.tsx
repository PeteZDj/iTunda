import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getProduce } from '../services/api';
import type { ProduceResponse } from '../types';
import './LandingPage.css';

const CATEGORY_ICONS: Record<string, string> = {
  'Avocados': '🥑', 'Macadamia Nuts': '🌰', 'French Beans': '🫛', 'Tea': '🍵',
  'Peas & Mange Tout': '🫛', 'Passion Fruit': '🍈', 'Mangoes': '🥭', 'Bananas': '🍌',
  'Tomatoes': '🍅', 'Onions': '🧅', 'Capsicum & Peppers': '🫑', 'Roses': '🌹',
};

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = Math.ceil(to / 60);
      const t = setInterval(() => {
        start = Math.min(start + step, to);
        setVal(start);
        if (start >= to) clearInterval(t);
      }, 16);
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [featured, setFeatured] = useState<ProduceResponse[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getProduce({ category: 'Avocados' })
      .then(data => setFeatured(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  return (
    <div className="landing">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg-orb hero-orb-1" />
        <div className="hero-bg-orb hero-orb-2" />
        <div className="hero-bg-orb hero-orb-3" />
        <div className="page-container hero-content">
          <div className="hero-tag">🌍 Kenya's #1 Farm-to-Fork Platform</div>
          <h1 className="hero-title">
            Fresh Produce,<br />
            <span className="hero-title-accent">Direct from the Farm.</span>
          </h1>
          <p className="hero-sub">
            Connect with 15+ certified Kenyan farmers. Browse 1,000+ listings of
            avocados, macadamia, roses, tea, and more — with real-time expiry dates,
            GPS farm locations, and export-ready certification.
          </p>
          <div className="hero-cta">
            <Link to="/browse" className="btn btn-amber btn-lg">Browse Produce →</Link>
            <Link to="/register" className="btn btn-outline-white btn-lg">Join as Farmer</Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num"><Counter to={1000} suffix="+" /></span>
              <span className="hero-stat-label">Listings</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num"><Counter to={15} /></span>
              <span className="hero-stat-label">Farmers</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num"><Counter to={12} /></span>
              <span className="hero-stat-label">Categories</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num"><Counter to={47} /></span>
              <span className="hero-stat-label">Counties</span>
            </div>
          </div>
        </div>
        <div className="hero-scroll-hint">
          <div className="scroll-dot" />
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────── */}
      <div className="trust-bar">
        <div className="page-container trust-inner">
          {[
            ['🏆', 'GlobalG.A.P Certified Farms'],
            ['🚚', 'Farm-to-Door Delivery'],
            ['📍', 'Real GPS Farm Locations'],
            ['📦', 'Export-Ready Grading'],
            ['⏱', 'Live Expiry Tracking'],
          ].map(([icon, text]) => (
            <div key={text} className="trust-item">
              <span className="trust-icon">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ───────────────────────────────────────── */}
      <section className="section categories-section">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-title">Top Export Categories</h2>
            <p className="section-sub">Kenya's 12 highest-value agricultural export products</p>
          </div>
          <div className="categories-grid">
            {(categories.length ? categories : Object.keys(CATEGORY_ICONS)).map(cat => (
              <Link key={cat} to={`/browse?category=${encodeURIComponent(cat)}`} className="category-card">
                <span className="category-icon">{CATEGORY_ICONS[cat] ?? '🌱'}</span>
                <span className="category-name">{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="hiw-section">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-title text-white">How iTunda Works</h2>
            <p className="section-sub" style={{ color: 'rgba(255,255,255,0.7)' }}>
              From farm to your door in three simple steps
            </p>
          </div>
          <div className="hiw-grid">
            {[
              { n: '1', icon: '🔍', title: 'Browse & Search', desc: 'Search by produce name, county, category or export-readiness. Filter 1,000+ live listings with full farmer profiles and GPS locations.' },
              { n: '2', icon: '🛒', title: 'Place an Order', desc: 'Choose quantity, set your delivery address, and order from one or many farmers in a single checkout. Mix categories freely.' },
              { n: '3', icon: '🚚', title: 'Get it Delivered', desc: 'Our rider network picks up from the farm and delivers to you. Track status from Assigned → In Transit → Delivered in real time.' },
            ].map(({ n, icon, title, desc }) => (
              <div key={n} className="hiw-card">
                <div className="hiw-number">{n}</div>
                <div className="hiw-icon">{icon}</div>
                <h3 className="hiw-title">{title}</h3>
                <p className="hiw-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCE ─────────────────────────────────── */}
      <section className="section featured-section">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-title">Featured: Fresh Avocados</h2>
            <Link to="/browse?category=Avocados" className="section-link">See all →</Link>
          </div>
          <div className="featured-grid">
            {featured.map(item => (
              <Link key={item.id} to={`/produce/${item.id}`} className="featured-card">
                <div className="featured-card-top">
                  <span className="featured-icon">🥑</span>
                  <div>
                    <div className="featured-name">{item.name}</div>
                    <div className="featured-farm">{item.farmName}</div>
                  </div>
                </div>
                <div className="featured-price">KES {item.price.toLocaleString()}/{item.unit}</div>
                <div className="featured-meta">
                  <span>📍 {item.county}</span>
                  <span>★ {item.farmerRating.toFixed(1)}</span>
                </div>
                {item.isExportReady && <span className="badge badge-amber" style={{ marginTop: 8 }}>✈ Export Ready</span>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO USES ITUNDA ──────────────────────────────────── */}
      <section className="section audience-section">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-title">Built for Everyone in the Chain</h2>
          </div>
          <div className="audience-grid">
            {[
              { icon: '🌾', title: 'Farmers', desc: 'Post your harvests, set availability windows for future crops, reach export buyers and local stores — all from one dashboard.' },
              { icon: '🏪', title: 'Grocery Stores', desc: 'Source fresh produce directly from farms. Reduce middlemen, get better prices and traceability for your customers.' },
              { icon: '✈️', title: 'Exporters', desc: 'Filter by export-ready certification, grade quality and volume. Contact multiple farmers for bulk consolidated orders.' },
              { icon: '🍽️', title: 'Restaurants', desc: 'Schedule regular deliveries of seasonal produce. Know exactly where your ingredients come from — down to GPS coordinates.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="audience-card">
                <div className="audience-icon">{icon}</div>
                <h3 className="audience-title">{title}</h3>
                <p className="audience-desc">{desc}</p>
                <Link to="/register" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>Get Started</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section className="cta-section">
        <div className="page-container cta-inner">
          <div>
            <h2 className="cta-title">Ready to source Kenya's best produce?</h2>
            <p className="cta-sub">Join hundreds of buyers and farmers already on iTunda</p>
          </div>
          <div className="cta-actions">
            <Link to="/browse" className="btn btn-amber btn-lg">Browse Listings</Link>
            <Link to="/register" className="btn btn-outline-white btn-lg">Create Account</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="footer">
        <div className="page-container footer-inner">
          <div className="footer-brand">
            <span className="nav-logo-text" style={{ fontSize: 20 }}>🌿 iTunda</span>
            <p>Kenya's farm-to-fork marketplace connecting farmers, stores and exporters.</p>
          </div>
          <div className="footer-links">
            <strong>Platform</strong>
            <Link to="/browse">Browse Produce</Link>
            <Link to="/farmers">Farmers</Link>
            <Link to="/register">Join as Farmer</Link>
          </div>
          <div className="footer-links">
            <strong>Account</strong>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Register</Link>
            <Link to="/orders">My Orders</Link>
          </div>
          <div className="footer-links">
            <strong>Categories</strong>
            <Link to="/browse?category=Avocados">Avocados</Link>
            <Link to="/browse?category=Roses">Roses</Link>
            <Link to="/browse?category=Tea">Tea</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="page-container">
            © {new Date().getFullYear()} iTunda — Farm to Fork Marketplace, Kenya
          </div>
        </div>
      </footer>
    </div>
  );
}
