import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import ProductCard from '../components/ui/ProductCard';

export default function Wishlist() {
  const { user, loading } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { navigate('/auth?redirect=/wishlist'); return; }
    if (!loading && user) loadWishlist();
  }, [user, loading]);

  const loadWishlist = async () => {
    setFetching(true);
    const { data } = await supabase
      .from('wishlist')
      .select('product_id, products(*, categories(name, name_ar))')
      .eq('user_id', user.id);
    setProducts((data || []).map((row) => row.products).filter(Boolean));
    setFetching(false);
  };

  if (loading || fetching) {
    return <div className="spinner" style={{ marginTop: '5rem' }} />;
  }

  if (products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1rem' }}>
        <Heart size={64} style={{ color: 'var(--color-primary)', marginBottom: '1rem', opacity: .4 }} />
        <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '.5rem' }}>قائمة المفضلة فارغة</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>أضف منتجات تعجبك بالضغط على ❤️</p>
        <Link to="/shop" className="btn btn-primary">{t.shopNow}</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container">
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: '2rem' }}>
          المفضلة ({products.length})
        </h1>
        <div className="shop__grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  );
}
