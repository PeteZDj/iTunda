import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, getProduce, getRegions } from '../services/api';
import { useRegion } from '../context/RegionContext';
import { useCurrency } from '../context/CurrencyContext';
import { flagUrl } from '../lib/geo';
import { CATEGORY_ICONS } from '../lib/categories';
import type { ProduceResponse, RegionDto } from '../types';
import { DemoHarvestSection } from '../components/DemoCatalogue';
import { useDemoHarvests } from '../hooks/useDemoHarvests';
import './LandingPage.css';

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      let start = 0;
      const step = Math.max(1, Math.ceil(to / 60));
      interval = setInterval(() => {
        start = Math.min(start + step, to);
        setVal(start);
        if (start >= to && interval) clearInterval(interval);
      }, 16);
    };
    // Prefer triggering when scrolled into view, but the hero stats are above
    // the fold — so also fall back to running on mount (also fixes SSR/headless).
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { obs.disconnect(); run(); }
    });
    if (ref.current) obs.observe(ref.current);
    const fallback = setTimeout(run, 400);
    return () => { obs.disconnect(); clearTimeout(fallback); if (interval) clearInterval(interval); };
  }, [to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
  const demoHarvests = useDemoHarvests();
  const [categories, setCategories] = useState<string[]>([]);
  const [featured, setFeatured] = useState<ProduceResponse[]>([]);
  const [regions, setRegions] = useState<RegionDto[]>([]);
  const { setRegion } = useRegion();
  const { format } = useCurrency();
  const navigate = useNavigate();

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getRegions().then(setRegions).catch(() => {});
    getProduce({ category: 'Avocados' })
      .then(data => setFeatured(data.slice(0, 6)))
      .catch(() => {});
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
          <div className="hero-tag">🌍 Global Farm-to-Fork Commodity Marketplace</div>
          <h1 className="hero-title">
            Fresh Produce,<br />
            <span className="hero-title-accent">Direct from the Farm.</span>
          </h1>
          <p className="hero-sub">
            Find avocados, macadamia, tea and more from growers. Compare listings, estimate delivery,
            or explore interactive commodity charts in the demo market.
          </p>
          <div className="hero-cta">
            <Link to="/browse" className="btn btn-amber btn-lg">Browse Produce →</Link>
            <Link to="/market" className="btn btn-outline-white btn-lg">Open the Exchange</Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num"><Counter to={regions.length} /></span>
              <span className="hero-stat-label">Regions</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num"><Counter to={categories.length} /></span>
              <span className="hero-stat-label">Crop categories</span>
            </div>
          </div>
        </div>
        <div className="hero-scroll-hint">
          <div className="scroll-dot" />
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* ── STUDIO BAND ──────────────────────────────────────── */}
      <section className="studio">
        <div className="studio-head">
          <span className="studio-eyebrow">From the shoot</span>
          <h2 className="studio-title">Grown, graded, packed, exported.</h2>
          <p className="studio-sub">
            A look at the crops, growers and packing practices behind the marketplace.
          </p>
        </div>
        <div className="studio-grid">
          <figure className="studio-item">
            <img src="/images/studio-hands.webp" alt="Freshly picked tea leaves held in cupped hands" loading="lazy" width="1200" height="1200" />
            <figcaption>Picked by hand</figcaption>
          </figure>
          <figure className="studio-item">
            <img src="/images/studio-avocado.webp" alt="A ripe avocado halved on a clay plate" loading="lazy" width="1200" height="1200" />
            <figcaption>Graded for export</figcaption>
          </figure>
          <figure className="studio-item">
            <img src="/images/studio-basket.webp" alt="A sisal basket filled with mixed green produce" loading="lazy" width="1200" height="1200" />
            <figcaption>Packing a harvest</figcaption>
          </figure>
          <figure className="studio-item studio-wide">
            <img src="/images/studio-farmers.webp" alt="Two farmers behind a table of baskets holding avocados, tea and macadamia" loading="lazy" width="2400" height="1350" />
            <figcaption>Growers and their crops</figcaption>
          </figure>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────── */}
      <div className="trust-bar">
        <div className="page-container trust-inner">
          {[
            ['🌱', 'Direct Grower Listings'],
            ['📈', 'Demo Commodity Charts'],
            ['📍', 'GPS Farm Pins on Maps'],
            ['🤝', 'Buy & Sell Order Book'],
            ['🚚', 'Instant Delivery Estimates'],
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
            <h2 className="section-title">Browse by Commodity</h2>
            <p className="section-sub">Find listings by crop or produce category.</p>
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
      <section className="section regions-section">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-title">Sourcing from Top Growing Regions</h2>
            <p className="section-sub">Certified origins across four export zones — tap a region to browse its produce</p>
          </div>
          <div className="regions-grid">
            {regions.map(r => (
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
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="hiw-section">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-title text-white">How iTunda Works</h2>
            <p className="section-sub" style={{ color: 'rgba(255,255,255,0.7)' }}>
              From farm to global market in three simple steps
            </p>
          </div>
          <div className="hiw-grid">
            {[
              { n: '1', icon: '🔍', title: 'Browse & Compare', desc: 'Search available listings by commodity or region, or explore simulated price changes on the demo charts.' },
              { n: '2', icon: '🤝', title: 'Trade Buy & Sell', desc: 'Order directly, or post a commodity-style buy order at your target price. Match with farm-gate offers across the exchange.' },
              { n: '3', icon: '🚚', title: 'Estimate & Ship', desc: 'Check delivery routes and freight prices between any region and market hub — instantly, with no login required.' },
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
      {featured.length === 0 && <div className="page-container">
        <DemoHarvestSection lots={demoHarvests.filter(lot => ['kirinyaga-roma', 'muranga-hass', 'kiambu-wheat-bran'].includes(lot.slug))} />
        <Link to="/browse" className="btn btn-outline btn-sm">Browse all categories →</Link>
      </div>}
      {featured.length > 0 && <section className="section featured-section">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-title">Featured: Fresh Avocados</h2>
            <Link to="/browse/Avocados" className="section-link">See all →</Link>
          </div>
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
                    <span>★ {item.farmerRating.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>}

      {/* ── WHO USES ITUNDA ──────────────────────────────────── */}
      <section className="section audience-section">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-title">Built for Everyone in the Chain</h2>
          </div>
          <div className="audience-grid">
            {[
              { icon: '🌾', title: 'Farmers', desc: 'Post harvests, set availability windows, and reach export buyers worldwide from one dashboard.' },
              { icon: '🏪', title: 'Grocery Stores', desc: 'Source fresh produce directly from farms and see details the grower shares about each harvest.' },
              { icon: '✈️', title: 'Exporters', desc: 'Filter by export-ready grade, post bulk buy orders, and estimate freight to any market hub.' },
              { icon: '🍽️', title: 'Restaurants', desc: 'Schedule seasonal deliveries and know exactly where your ingredients come from — to the GPS pin.' },
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
            <h2 className="cta-title">Ready to trade the world's best produce?</h2>
            <p className="cta-sub">Buy and sell produce or explore the demo exchange.</p>
          </div>
          <div className="cta-actions">
            <Link to="/market" className="btn btn-amber btn-lg">Open the Exchange</Link>
            <Link to="/delivery" className="btn btn-outline-white btn-lg">Estimate Delivery</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="footer">
        <div className="page-container footer-inner">
          <div className="footer-brand">
            <span className="nav-logo-text" style={{ fontSize: 20 }}>🌿 iTunda</span>
            <p>The global farm-to-fork commodity marketplace connecting farmers, stores and exporters.</p>
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
            <Link to="/market">Commodity Exchange</Link>
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
            © {new Date().getFullYear()} iTunda — Global Farm-to-Fork Marketplace
          </div>
        </div>
      </footer>
    </div>
  );
}
