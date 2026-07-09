import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './DownloadsPage.css';

const APK_URL = '/dl/itunda.apk';

export default function DownloadsPage() {
  const [apkReady, setApkReady] = useState<boolean | null>(null);
  const [apkSize, setApkSize] = useState<string>('');

  useEffect(() => {
    fetch(APK_URL, { method: 'HEAD' })
      .then(res => {
        if (res.ok) {
          setApkReady(true);
          const len = res.headers.get('content-length');
          if (len) setApkSize(`${(Number(len) / 1_048_576).toFixed(1)} MB`);
        } else setApkReady(false);
      })
      .catch(() => setApkReady(false));
  }, []);

  const features = [
    ['🛒', 'Buy & bid on the go', 'Place spot orders, limit bids, futures and put contracts from your phone.'],
    ['🌱', 'Sell your harvest', 'Snap a photo, add plant + best-before dates and your farm location, and list in minutes.'],
    ['📈', 'Live commodity prices', 'Real-time farm-gate prices across 25 commodities and 4 export zones.'],
    ['🗺️', 'Maps & delivery routes', 'Drop farm pins, meet distributors and estimate freight instantly.'],
    ['🏳️', 'Multi-region & currency', 'Trade across Africa, the Americas and beyond in your local currency.'],
    ['🔔', 'Order tracking', 'Follow every order from farm gate to fork with live status updates.'],
  ];

  return (
    <div className="dl-page">
      <div className="dl-hero">
        <div className="page-container dl-hero-inner">
          <div className="dl-hero-copy">
            <span className="dl-badge">📱 iTunda for Android</span>
            <h1>Trade fresh produce from your pocket</h1>
            <p>
              The iTunda mobile app puts the whole farm-to-futures marketplace in your hand —
              buy, sell, bid and track deliveries anywhere.
            </p>

            <div className="dl-actions">
              {apkReady === false ? (
                <button className="btn btn-lg btn-amber" disabled>⏳ APK building — check back soon</button>
              ) : (
                <a className="btn btn-lg btn-amber" href={APK_URL} download>
                  ⬇ Download Android APK{apkSize ? ` · ${apkSize}` : ''}
                </a>
              )}
              <a className="btn btn-lg btn-outline-white" href="https://github.com/PeteZDj/iTunda" target="_blank" rel="noreferrer">
                View source on GitHub
              </a>
            </div>
            <p className="dl-note">
              Android 8.0+ · Free · You may need to allow “install from unknown sources”.
              {apkReady === false && ' The signed build is being prepared and this link activates automatically once it’s ready.'}
            </p>
          </div>

          <div className="dl-hero-art">
            <div className="dl-phone">
              <div className="dl-phone-notch" />
              <div className="dl-phone-screen">
                <div className="dl-ps-top">🌿 iTunda</div>
                <div className="dl-ps-ticker">🥑 Avocados <b>▲ 1.4%</b></div>
                <div className="dl-ps-card"><span>🥭 Mangoes</span><b className="buy">BUY</b></div>
                <div className="dl-ps-card"><span>☕ Coffee</span><b className="sell">SELL</b></div>
                <div className="dl-ps-card"><span>🌹 Roses</span><b className="buy">BUY</b></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container dl-body">
        <h2 className="dl-section-title">Everything the website does — mobile-first</h2>
        <div className="dl-features">
          {features.map(([icon, title, body]) => (
            <div key={title} className="dl-feature card">
              <div className="dl-feature-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>

        <div className="dl-cta card">
          <div>
            <h3>Prefer the web?</h3>
            <p>Every feature is available right here in your browser — no install needed.</p>
          </div>
          <div className="dl-cta-btns">
            <Link to="/market" className="btn btn-buy">⇅ Open the Exchange</Link>
            <Link to="/browse" className="btn btn-outline">Browse produce</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
