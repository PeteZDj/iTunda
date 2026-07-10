import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RegionProvider } from './context/RegionContext';
import { CurrencyProvider } from './context/CurrencyContext';
import Navbar from './components/Navbar';
import CommodityTicker from './components/CommodityTicker';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrowsePage from './pages/BrowsePage';
import ProduceDetailPage from './pages/ProduceDetailPage';
import FarmersPage from './pages/FarmersPage';
import FarmerProfilePage from './pages/FarmerProfilePage';
import OrdersPage from './pages/OrdersPage';
import FarmerDashboardPage from './pages/FarmerDashboardPage';
import MarketPage from './pages/MarketPage';
import DeliveryPage from './pages/DeliveryPage';
import DownloadsPage from './pages/DownloadsPage';
import SellPage from './pages/SellPage';
import AccountPage from './pages/AccountPage';

function WithNav({ children }: { children: React.ReactNode }) {
  return <><Navbar /><CommodityTicker />{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RegionProvider>
          <CurrencyProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<WithNav><LandingPage /></WithNav>} />
              <Route path="/browse" element={<WithNav><BrowsePage /></WithNav>} />
              <Route path="/browse/:category" element={<WithNav><BrowsePage /></WithNav>} />
              <Route path="/market" element={<WithNav><MarketPage /></WithNav>} />
              <Route path="/delivery" element={<WithNav><DeliveryPage /></WithNav>} />
              <Route path="/downloads" element={<WithNav><DownloadsPage /></WithNav>} />
              <Route path="/produce/:id" element={<WithNav><ProduceDetailPage /></WithNav>} />
              <Route path="/farmers" element={<WithNav><FarmersPage /></WithNav>} />
              <Route path="/farmers/:id" element={<WithNav><FarmerProfilePage /></WithNav>} />
              <Route path="/orders" element={<WithNav><OrdersPage /></WithNav>} />
              <Route path="/sell" element={<WithNav><SellPage /></WithNav>} />
              <Route path="/account" element={<WithNav><AccountPage /></WithNav>} />
              <Route path="/dashboard" element={<WithNav><FarmerDashboardPage /></WithNav>} />
              <Route path="*" element={
                <WithNav>
                  <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                    <div style={{ fontSize: 60 }}>🌿</div>
                    <h2 style={{ marginTop: 16, color: '#0a5226' }}>Page not found</h2>
                    <a href="/" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>Go Home</a>
                  </div>
                </WithNav>
              } />
            </Routes>
          </CurrencyProvider>
        </RegionProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
