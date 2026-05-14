import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import wardLogo from '../../assets/ward.png';
import { ShoppingCart, Search, User, Menu, X, Heart, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCartStore } from '../../store/cartStore';
import { useLang } from '../../context/LangContext';
import { sanitizeSearch } from '../../utils/security';
import './Navbar.css';

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { t } = useLang();
  const items = useCartStore((s) => s.items);
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);   // wraps button + menu together
  const navigate = useNavigate();

  // Focus search input when it opens
  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);

  // Close dropdown when clicking anywhere outside it
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    const clean = sanitizeSearch(searchQuery);
    if (clean) {
      navigate(`/shop?q=${encodeURIComponent(clean)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSignOut = async (e) => {
    e?.preventDefault();
    try {
      await signOut();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setDropdownOpen(false);
      setMenuOpen(false);
      navigate('/');
    }
  };

  const closeDropdown = () => setDropdownOpen(false);

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <img src={wardLogo} alt="Ward 4U" className="navbar__logo-img" />
        </Link>

        {/* Desktop nav */}
        <nav className="navbar__links">
          <Link to="/" className="navbar__link">{t.home}</Link>
          <Link to="/shop" className="navbar__link">{t.shop}</Link>
          <Link to="/shop?cat=wedding" className="navbar__link">{t.wedding}</Link>
          <Link to="/shop?cat=gift-boxes" className="navbar__link">{t.gifts}</Link>
          <Link to="/about" className="navbar__link">{t.about}</Link>
        </nav>

        {/* Actions */}
        <div className="navbar__actions">
          {/* Search */}
          {searchOpen ? (
            <form onSubmit={handleSearch} className="navbar__search-form">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                maxLength={100}
                className="navbar__search-input"
                dir="rtl"
              />
              <button type="submit" aria-label="بحث"><Search size={18} /></button>
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="إغلاق"><X size={18} /></button>
            </form>
          ) : (
            <button className="navbar__icon-btn" onClick={() => setSearchOpen(true)} aria-label="بحث">
              <Search size={20} />
            </button>
          )}

          {/* Wishlist */}
          {user && (
            <Link to="/wishlist" className="navbar__icon-btn" aria-label={t.wishlist}>
              <Heart size={20} />
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="navbar__cart-btn" aria-label={t.cart}>
            <ShoppingCart size={20} />
            <span className="navbar__cart-label">{t.cart}</span>
            {cartCount > 0 && <span className="navbar__cart-badge">{cartCount}</span>}
          </Link>

          {/* User menu — click-toggle, closes on outside click */}
          {user ? (
            <div className="navbar__user-menu" ref={dropdownRef}>
              <button
                className="navbar__icon-btn"
                onClick={() => setDropdownOpen((v) => !v)}
                aria-label="القائمة"
                aria-expanded={dropdownOpen}
              >
                <User size={20} />
              </button>

              {dropdownOpen && (
                <div className="navbar__dropdown">
                  <span className="navbar__dropdown-name">
                    {profile?.full_name || user.email}
                  </span>
                  <Link to="/profile" className="navbar__dropdown-item" onClick={closeDropdown}>
                    <User size={15} /> {t.profile}
                  </Link>
                  <Link to="/orders" className="navbar__dropdown-item" onClick={closeDropdown}>
                    {t.orders}
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="navbar__dropdown-item" onClick={closeDropdown}>
                      <LayoutDashboard size={15} /> {t.admin}
                    </Link>
                  )}
                  <button className="navbar__dropdown-item navbar__dropdown-logout" onClick={handleSignOut}>
                    <LogOut size={15} /> {t.signOut}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary navbar__signin-btn">{t.signIn}</Link>
          )}

          {/* Hamburger */}
          <button className="navbar__hamburger" onClick={() => setMenuOpen((v) => !v)} aria-label="القائمة">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="navbar__mobile-menu">
          <Link to="/" onClick={() => setMenuOpen(false)}>{t.home}</Link>
          <Link to="/shop" onClick={() => setMenuOpen(false)}>{t.shop}</Link>
          <Link to="/shop?cat=wedding" onClick={() => setMenuOpen(false)}>{t.wedding}</Link>
          <Link to="/shop?cat=gift-boxes" onClick={() => setMenuOpen(false)}>{t.gifts}</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}>{t.about}</Link>
          {!user && <Link to="/auth" onClick={() => setMenuOpen(false)} className="btn btn-primary">{t.signIn}</Link>}
          {user && <Link to="/profile" onClick={() => setMenuOpen(false)}>{t.profile}</Link>}
          {user && <Link to="/orders" onClick={() => setMenuOpen(false)}>{t.orders}</Link>}
          {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)}>{t.admin}</Link>}
          {user && <button onClick={handleSignOut}>{t.signOut}</button>}
        </nav>
      )}
    </header>
  );
}
