import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Users, Eye, ShoppingBag } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { supabase } from '../../lib/supabase';
import wardLogo from '../../assets/logo.png';
import './Footer.css';

function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export default function Footer() {
  const { t } = useLang();
  const [stats, setStats] = useState({ users: 0, views: 0, orders: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('view_count'),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
    ]).then(([users, products, orders]) => {
      const totalViews = (products.data || []).reduce((sum, p) => sum + (p.view_count || 0), 0);
      setStats({
        users: users.count || 0,
        views: totalViews,
        orders: orders.count || 0,
      });
    });
  }, []);

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">
            <img src={wardLogo} alt="Ward 4U" className="footer__logo-img" />
          </div>
          <p>{t.footerDesc}</p>
          {/* <div className="footer__socials">
            <a href="#" aria-label="Instagram" className="footer__social"><InstagramIcon /></a>
          </div>*/}
        </div>

        <div className="footer__col">
          <h3>{t.quickLinks}</h3>
          <Link to="/">{t.home}</Link>
          <Link to="/shop">{t.shop}</Link>
          <Link to="/shop?cat=wedding">زهور الزفاف</Link>
          <Link to="/shop?cat=gift-boxes">صناديق الهدايا</Link>
          <Link to="/about">{t.about}</Link>
        </div>

        <div className="footer__col">
          <h3>{t.categories}</h3>
          <Link to="/shop?cat=roses">ورود</Link>
          <Link to="/shop?cat=bouquets">باقات</Link>
          <Link to="/shop?cat=arrangements">تنسيقات</Link>
          <Link to="/shop?cat=succulents">نباتات عصارية</Link>
        </div>

        <div className="footer__col">
          <h3>{t.contact}</h3>
          <a href="tel:+972528997136" className="footer__contact-item">
            <Phone size={15} /> 0528997136
          </a>
          <a href="mailto:hello@ward4u.com" className="footer__contact-item">
            <Mail size={15} /> Waledbr@gmail.com
          </a>
          <span className="footer__contact-item">
            <MapPin size={15} /> الناصره-الفاخوره
          </span>
        </div>
      </div>

      <div className="footer__stats">
        <div className="container footer__stats-inner">
          <div className="footer__stat">
            <div className="footer__stat-icon footer__stat-icon--pink">
              <Users size={22} />
            </div>
            <span className="footer__stat-num">+{stats.users}</span>
            <span className="footer__stat-label">مستخدم مسجل</span>
          </div>
          <div className="footer__stat">
            <div className="footer__stat-icon footer__stat-icon--rose">
              <Eye size={22} />
            </div>
            <span className="footer__stat-num">+{stats.views}</span>
            <span className="footer__stat-label">زيارة للموقع</span>
          </div>
          <div className="footer__stat">
            <div className="footer__stat-icon footer__stat-icon--gold">
              <ShoppingBag size={22} />
            </div>
            <span className="footer__stat-num">+{stats.orders}</span>
            <span className="footer__stat-label">طلب مكتمل</span>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container">
          <p>© {new Date().getFullYear()} ورد 4U. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
