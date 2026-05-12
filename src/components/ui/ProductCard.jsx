import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);
  const { user } = useAuth();
  const { t } = useLang();
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding]         = useState(false);

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (product.stock === 0) return;
    setAdding(true);
    addItem(product, 1);
    toast.success(`${product.name_ar || product.name} أُضيف إلى السلة!`);
    setTimeout(() => setAdding(false), 600);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('يرجى تسجيل الدخول لإضافة إلى المفضلة'); return; }
    if (wishlisted) {
      await supabase.from('wishlist').delete().match({ user_id: user.id, product_id: product.id });
      setWishlisted(false);
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, product_id: product.id });
      setWishlisted(true);
      toast.success('أُضيف إلى المفضلة!');
    }
  };

  return (
    <Link to={`/product/${product.slug}`} className="product-card">
      <div className="product-card__img-wrap">
        <img src={product.image_url} alt={product.name_ar || product.name} loading="lazy" />
        {discount && <span className="product-card__discount">-{discount}%</span>}
        {product.stock === 0 && <span className="product-card__out">{t.outOfStock}</span>}
        <button
          className={`product-card__wish ${wishlisted ? 'product-card__wish--active' : ''}`}
          onClick={handleWishlist}
          aria-label="مفضلة"
        >
          <Heart size={16} />
        </button>
      </div>

      <div className="product-card__body">
        <p className="product-card__category">
          {product.categories?.name_ar || product.categories?.name}
        </p>
        <h3 className="product-card__name">{product.name_ar || product.name}</h3>

        <div className="product-card__price-row">
          <span className="product-card__price">{product.price.toFixed(2)} {t.sar}</span>
          {product.original_price && (
            <span className="product-card__original">{product.original_price.toFixed(2)} {t.sar}</span>
          )}
        </div>
        {product.bulk_min_qty && product.bulk_discount_pct && (
          <p className="product-card__bulk">خصم {product.bulk_discount_pct}% عند شراء {product.bulk_min_qty}+</p>
        )}

        <button
          className={`btn btn-primary product-card__btn ${adding ? 'product-card__btn--adding' : ''}`}
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          <ShoppingCart size={16} />
          {product.stock === 0 ? t.outOfStock : adding ? t.added : t.addToCart}
        </button>
      </div>
    </Link>
  );
}
