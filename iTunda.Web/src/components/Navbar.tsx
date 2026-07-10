import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RegionSelector from './RegionSelector';
import './Navbar.css';

export default function Navbar() {
  const { isLoggedIn, name, role, image, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };

  const active = (path: string) => location.pathname === path ? 'nav-link active' : 'nav-link';

  // Anyone can sell — the sell flow handles sign-up at publish time.
  const sellHref = '/sell';

  return (
    <nav className="navbar">
      <div className="navbar-inner page-container">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-icon">🌿</span>
          <span className="nav-logo-text">i<b>Tunda</b></span>
        </Link>

        <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span /><span /><span />
        </button>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/browse" className={active('/browse')} onClick={() => setMenuOpen(false)}>Browse</Link>
          <Link to="/market" className={active('/market')} onClick={() => setMenuOpen(false)}>Market</Link>
          <Link to="/delivery" className={active('/delivery')} onClick={() => setMenuOpen(false)}>Delivery</Link>
          <Link to="/farmers" className={active('/farmers')} onClick={() => setMenuOpen(false)}>Farmers</Link>
          <Link to="/downloads" className={active('/downloads')} onClick={() => setMenuOpen(false)}>
            <span className="nav-dl">⬇ Get the App</span>
          </Link>

          <RegionSelector />

          <Link to={sellHref} className="btn btn-sell btn-sm" onClick={() => setMenuOpen(false)}>＋ Sell</Link>
          <Link to="/market" className="btn btn-buy btn-sm" onClick={() => setMenuOpen(false)}>⇅ Trade</Link>

          {isLoggedIn ? (
            <>
              <Link to="/orders" className={active('/orders')} onClick={() => setMenuOpen(false)}>Orders</Link>
              {role === 'Farmer' && (
                <Link to="/dashboard" className={active('/dashboard')} onClick={() => setMenuOpen(false)}>Dashboard</Link>
              )}
              <div className="nav-user-menu">
                <button className="nav-avatar">
                  {image ? <img src={image} alt={name ?? 'me'} /> : (name?.[0]?.toUpperCase() ?? '?')}
                </button>
                <div className="nav-dropdown">
                  <div className="nav-dropdown-header">
                    <strong>{name}</strong>
                    <span className="text-sm text-muted">{role}</span>
                  </div>
                  <Link to="/account" className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>Account</Link>
                  <button className="nav-dropdown-item danger" onClick={handleLogout}>Sign Out</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className="btn btn-amber btn-sm" onClick={() => setMenuOpen(false)}>Join Free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
