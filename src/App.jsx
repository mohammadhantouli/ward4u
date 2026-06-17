import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    supabase.rpc('increment_site_visits').then(({ error }) => {
      if (error) console.error('visit rpc error:', error);
    });
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
import './App.css';

/* ---- Floating WhatsApp Button ---- */
function WhatsAppFloat() {
  const phone = '972528997136'; // ← غيّر هذا الرقم لرقمك
  const message = encodeURIComponent('مرحباً، أريد الاستفسار عن منتجاتكم 🌸');
  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="تواصل عبر واتساب"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28" fill="#fff">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 2.823.736 5.476 2.027 7.784L0 32l8.395-2.002A15.94 15.94 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.29 13.29 0 0 1-6.747-1.83l-.484-.29-5.017 1.196 1.236-4.888-.319-.503A13.31 13.31 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.31-9.988c-.4-.2-2.368-1.167-2.735-1.3-.367-.133-.634-.2-.9.2s-1.034 1.3-1.267 1.567c-.233.267-.467.3-.867.1-.4-.2-1.688-.622-3.216-1.983-1.188-1.06-1.99-2.37-2.223-2.77-.233-.4-.025-.616.175-.816.18-.178.4-.467.6-.7.2-.233.267-.4.4-.667.133-.267.067-.5-.033-.7-.1-.2-.9-2.17-1.234-2.97-.324-.78-.654-.674-.9-.686l-.767-.013c-.267 0-.7.1-1.067.5s-1.4 1.367-1.4 3.333 1.433 3.867 1.633 4.133c.2.267 2.822 4.307 6.836 6.037.956.413 1.702.66 2.284.845.96.305 1.834.262 2.524.159.77-.115 2.368-.968 2.702-1.903.333-.934.333-1.734.233-1.903-.1-.167-.367-.267-.767-.467z"/>
      </svg>
      <span>واتساب</span>
    </a>
  );
}

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
        <WhatsAppFloat />
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
