import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    supabase.from('site_visits').insert({});
  }, [pathname]);
  return null;
}
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Auth from './pages/Auth';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import About from './pages/About';
import Wishlist from './pages/Wishlist';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <LangProvider>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/"               element={<Home />} />
              <Route path="/shop"           element={<Shop />} />
              <Route path="/product/:slug"  element={<ProductDetail />} />
              <Route path="/cart"           element={<Cart />} />
              <Route path="/checkout"       element={<Checkout />} />
              <Route path="/auth"           element={<Auth />} />
              <Route path="/orders"         element={<Orders />} />
              <Route path="/profile"        element={<Profile />} />
              <Route path="/admin"          element={<Admin />} />
              <Route path="/about"          element={<About />} />
              <Route path="/wishlist"       element={<Wishlist />} />
              <Route path="*"              element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              background: '#fff',
              color: '#2D2D2D',
              boxShadow: '0 4px 16px rgba(201,107,122,.2)',
            },
            success: { iconTheme: { primary: '#C96B7A', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '6rem 0' }}>
      <h1 style={{ fontSize: '4rem', color: 'var(--color-primary-dark)' }}>404</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>الصفحة غير موجودة</p>
      <a href="/" className="btn btn-primary">العودة للرئيسية</a>
    </div>
  );
}
