import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, getProduce, getRegions } from '../services/api';
import { useRegion } from '../context/RegionContext';
import { useCurrency } from '../context/CurrencyContext';
import { flagUrl } from '../lib/geo';
import { CATEGORY_ICONS } from '../lib/categories';
import type { ProduceResponse, RegionDto } from '../types';
import './LandingPage.css';

export default function LandingPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [featured, setFeatured] = useState<ProduceResponse[]>([]);
  const [regions, setRegions] = useState<RegionDto[]>([]);
  const [stockState, setStockState] = useState<'loading' | 'ready' | 'error'>('loading');
  const { setRegion } = useRegion();
  const { format } = useCurrency();
  const navigate = useNavigate();

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getRegions().then(setRegions).catch(() => {});
    getProduce({ limit: 6 })
      .then(data => { setFeatured(data); setStockState('ready'); })
      .catch(() => setStockState('error'));
  }, []);

  const openRegion = (name: string) => { setRegion(name); navigate('/browse'); };

  return (
    <div className="landing">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-photo" />
        <div className="hero-bg-orb hero-orb-1" />
        <div className="hero-bg-orb hero-orb-2" />
        <div className="hero-bg-orb hero-orb-3" />
        <div className="page-container hero-content">
          <div className="hero-tag">A marketplace for growers and local buyers</div>
          <h1 className="hero-title">
            Sell what you grow.<br />
            <span className="hero-title-accent">Buy from the grower.</span>
          </h1>
          <p className="hero-sub">
            From a small plot to a full harvest, list fresh crops and animal feed while they're available.
            Households, shops and restaurants can see where a batch came from, check its dates and buy directly from the grower.
          </p>
          <div className="hero-cta">
            <Link to="/browse" className="btn btn-amber btn-lg">Browse available harvests</Link>
            <Link to="/sell" className="btn btn-outline-white btn-lg">Post your harvest</Link>
          </div>
        </div>
      </section>

      {/* ── STUDIO BAND ──────────────────────────────────────── */}
      <section className="studio">
        <div className="studio-head">
          <h2 className="studio-title">From harvest to the next buyer</h2>
          <p className="studio-sub">Illustrations of how crops are picked, sorted and packed.</p>
        </div>
        <div className="studio-grid">
          <figure className="studio-item">
            <img src="/images/studio-hands.webp" alt="Freshly picked tea leaves held in cupped hands" loading="lazy" width="1200" height="1200" />
            <figcaption>Picked by hand</figcaption>
          </figure>
          <figure className="studio-item">
            <img src="/images/studio-avocado.webp" alt="A ripe avocado halved on a clay plate" loading="lazy" width="1200" height="1200" />
            <figcaption>Sorted by the grower</figcaption>
          </figure>
          <figure className="studio-item">
            <img src="/images/studio-basket.webp" alt="A sisal basket filled with mixed green produce" loading="lazy" width="1200" height="1200" />
            <figcaption>Packed for pickup or delivery</figcaption>
          </figure>
          <figure className="studio-item studio-wide">
            <img src="/images/studio-farmers.webp" alt="Two farmers behind a table of baskets holding avocados, tea and macadamia" loading="lazy" width="2400" height="1350" />
            <figcaption>From small farms to larger growers</figcaption>
          </figure>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────── */}
      <div className="trust-bar">
        <div className="page-container trust-inner">
          {[
            ['📷', 'Grower photos'],
            ['📆', 'Best-before dates'],
            ['📍', 'Farm of origin'],
            ['🤝', 'Direct orders'],
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
            <h2 className="section-title">Browse crops and feed</h2>
          </div>
          <div className="categories-grid">
            {(categories.length ? categories : Object.keys(CATEGORY_ICONS)).map(cat => (
              <Link key={cat} to={`/browse/${encodeURIComponent(cat)}`} className="category-card">
                <span className="category-icon">{CATEGORY_ICONS[cat] ?? '🌱'}</span>
                <span className="category-name">{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── GROWING REGIONS ──────────────────────────────────── */}
      {regions.some(region => region.listingCount > 0) && <section className="section regions-section">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-title">Growing regions with stock</h2>
          </div>
          <div className="regions-grid">
            {regions.filter(r => r.listingCount > 0).map(r => (
              <button key={r.name} className="region-card" onClick={() => openRegion(r.name)}>
                <img className="region-card-flag" src={flagUrl(r.countryCode, '40x30')} alt="" />
                <div className="region-card-info">
                  <span className="region-card-name">{r.name}</span>
                  <span className="region-card-country">{r.country} · Zone {r.zone}</span>
                </div>
                <span className="region-card-count">{r.listingCount}</span>
              </button>
            ))}
          </div>
        </div>
      </section>}

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="hiw-section">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-title text-white">How iTunda Works</h2>
            <p className="section-sub" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Buy a small amount for home or find a supplier you can buy from again.
            </p>
          </div>
          <div className="hiw-grid">
            {[
              { n: '1', icon: '🌱', title: 'Post what you grew', desc: 'Add a photo, farm location, price, available quantity and best-before date. List a small batch or a bulk harvest.' },
              { n: '2', icon: '🧺', title: 'Find and order a batch', desc: 'See who grew it, check dates and availability, and request the amount you need. Call the grower when they share a number.' },
              { n: '3', icon: '🤝', title: 'Buy from the same grower again', desc: 'Agree pickup or delivery with the grower. Return to their profile to see what they post from the next harvest.' },
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
            <h2 className="section-title">Available harvests</h2>
            <Link to="/browse" className="section-link">Browse all →</Link>
          </div>
          {stockState === 'loading' && <p className="section-sub" role="status">Checking available harvests…</p>}
          {stockState === 'error' && <p className="section-sub" role="status">Listings couldn’t load. Try browsing again in a moment.</p>}
          {stockState === 'ready' && featured.length === 0 && (
            <div className="card">
              <p>No harvests are available right now. If you grow crops or feed, you can post your first batch.</p>
              <Link to="/sell" className="btn btn-primary" style={{ marginTop: 12 }}>Post a harvest</Link>
            </div>
          )}
          <div className="featured-grid">
            {featured.map(item => (
              <Link key={item.id} to={`/produce/${item.id}`} className="featured-card">
                <div className="featured-card-img" style={{ backgroundImage: `url(${item.imageUrl})` }}>
                  {item.isExportReady && <span className="badge badge-amber featured-card-badge">✈ Export</span>}
                </div>
                <div className="featured-card-body">
                  <div className="featured-card-top">
                    <img className="featured-icon-img" src={item.iconUrl} alt="" />
                    <div>
                      <div className="featured-name">{item.name}</div>
                      <div className="featured-farm">{item.farmName}</div>
                    </div>
                  </div>
                  <div className="featured-price">{format(item.price)}/{item.unit}</div>
                  <div className="featured-meta">
                    <span><img className="pc-flag" src={flagUrl(item.countryCode)} alt="" /> {item.region}</span>
                    {item.expiryDate && <span>Best before {item.expiryDate.slice(0, 10)}</span>}
                  </div>
                </div>
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
              { icon: '🌾', title: 'Growers of all sizes', desc: 'Sell a few kilos, a crate, or a bulk harvest and keep posting as new batches come in.', href: '/sell', action: 'Post your harvest' },
              { icon: '🏪', title: 'Shops and market vendors', desc: 'Find stock from growers and go back to suppliers that deliver what you need.', href: '/farmers', action: 'Find growers' },
              { icon: '🧺', title: 'Households and restaurants', desc: 'Choose the amount you need and check the farm, harvest details and best-before date.', href: '/browse', action: 'Browse crops' },
              { icon: '🐄', title: 'Livestock keepers', desc: 'Look for animal feed and forage with details on quantity, dates and where it was grown.', href: '/browse/Animal%20Feed', action: 'Browse animal feed' },
            ].map(({ icon, title, desc, href, action }) => (
              <div key={title} className="audience-card">
                <div className="audience-icon">{icon}</div>
                <h3 className="audience-title">{title}</h3>
                <p className="audience-desc">{desc}</p>
                <Link to={href} className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>{action}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section className="cta-section">
        <div className="page-container cta-inner">
          <div>
            <h2 className="cta-title">Have a harvest ready to sell?</h2>
            <p className="cta-sub">Start with a photo, a price and the quantity on hand.</p>
          </div>
          <div className="cta-actions">
            <Link to="/sell" className="btn btn-amber btn-lg">Post a harvest</Link>
            <Link to="/browse" className="btn btn-outline-white btn-lg">Browse produce</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="footer">
        <div className="page-container footer-inner">
          <div className="footer-brand">
            <span className="nav-logo-text" style={{ fontSize: 20 }}>🌿 iTunda</span>
            <p>Buy crops and animal feed directly from the people who grow them.</p>
            <a
              href="https://docall.app/itunda.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10, color: 'inherit' }}
            >
              <span aria-hidden="true">&#9742;</span>
              <span>Call us on <u>docall.app/itunda.org</u></span>
            </a>
          </div>
          <div className="footer-links">
            <strong>Platform</strong>
            <Link to="/browse">Browse Produce</Link>
            <Link to="/sell">Post a harvest</Link>
            <Link to="/delivery">Delivery Estimator</Link>
            <Link to="/farmers">Farmers</Link>
          </div>
          <div className="footer-links">
            <strong>Account</strong>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Register</Link>
            <Link to="/orders">My Orders</Link>
          </div>
          <div className="footer-links">
            <strong>Commodities</strong>
            <Link to="/browse/Avocados">Avocados</Link>
            <Link to="/browse/Roses">Roses</Link>
            <Link to="/browse/Tea">Tea</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="page-container">
            © {new Date().getFullYear()} iTunda
          </div>
        </div>
      </footer>
    </div>
  );
}
