import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { sanitizeURLParam, clampNumber, sanitizeText, isRateLimited } from '../utils/security';
import toast from 'react-hot-toast';
import ProductCard from '../components/ui/ProductCard';
import './ProductDetail.css';

export default function ProductDetail() {
  const { slug } = useParams();
  const safeSlug = sanitizeURLParam(slug || '');
  const { user } = useAuth();
  const { t } = useLang();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState(null);
  const [productNumber, setProductNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty]         = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!safeSlug) { setLoading(false); return; }
    const load = async () => {
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, name_ar, slug)')
        .eq('slug', safeSlug)
        .eq('is_active', true)
        .single();
      setProduct(data);
      setLoading(false);

      if (data) {
        const { data: revs } = await supabase
          .from('reviews')
          .select('*, profiles(full_name)')
          .eq('product_id', data.id)
          .order('created_at', { ascending: false });
        setReviews(revs || []);

        // Increment view counter
        const newCount = (data.view_count || 0) + 1;
        await supabase.from('products').update({ view_count: newCount }).eq('id', data.id);
        setProduct((p) => ({ ...p, view_count: newCount }));

        // Get sequential product number
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', data.created_at)
          .eq('is_active', true);
        setProductNumber(count || 1);

        // Related products
        if (data.category_id) {
          const { data: rel } = await supabase
            .from('products')
            .select('*, categories(name, name_ar, slug)')
            .eq('category_id', data.category_id)
            .eq('is_active', true)
            .neq('id', data.id)
            .limit(8);
          setRelated(rel || []);
        }
      }
    };
    load();
  }, [safeSlug]);

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    addItem(product, qty);
    toast.success(`${product.name_ar || product.name} أُضيف إلى السلة!`);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error(t.signInToReview); return; }
    if (isRateLimited(`review-${user.id}`, 3, 300_000)) {
      toast.error('محاولات كثيرة. انتظر قليلاً.');
      return;
    }
    const comment = sanitizeText(newReview.comment);
    const rating  = clampNumber(newReview.rating, 1, 5);
    setSubmitting(true);
    const { error } = await supabase.from('reviews').upsert(
      { product_id: product.id, user_id: user.id, rating, comment },
      { onConflict: 'product_id,user_id' }
    );
    if (error) toast.error('تعذّر إرسال التقييم.');
    else {
      toast.success('تم إرسال التقييم!');
      setNewReview({ rating: 5, comment: '' });
      const { data: revs } = await supabase
        .from('reviews').select('*, profiles(full_name)')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });
      setReviews(revs || []);
    }
    setSubmitting(false);
  };

  if (loading) return <div className="spinner" style={{ marginTop: '5rem' }} />;
  if (!product) return (
    <div className="pd-not-found">
      <h2>المنتج غير موجود</h2>
      <Link to="/shop" className="btn btn-primary">{t.backToShop}</Link>
    </div>
  );

  const allImages = [product.image_url, ...(product.images || [])].filter(Boolean);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="pd">
      <div className="container">
        <Link to="/shop" className="pd__back">
          {t.backToShop} <ChevronRight size={16} />
        </Link>

        <div className="pd__grid">
          {/* Images */}
          <div className="pd__images">
            <div className="pd__main-img" onClick={() => setLightbox(true)}>
              <img src={allImages[activeImg]} alt={product.name_ar || product.name} />
              <span className="pd__zoom-hint">🔍</span>
            </div>
            {allImages.length > 1 && (
              <div className="pd__thumbnails">
                {allImages.map((img, i) => (
                  <button key={i}
                    className={`pd__thumb ${i === activeImg ? 'pd__thumb--active' : ''}`}
                    onClick={() => setActiveImg(i)}>
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pd__info">
            <p className="pd__category">
              <Link to={`/shop?cat=${product.categories?.slug}`}>
                {product.categories?.name_ar || product.categories?.name}
              </Link>
            </p>
            <div className="pd__meta-row">
              {productNumber && <span className="pd__number">#{productNumber}</span>}
            </div>
            <h1 className="pd__name">{product.name_ar || product.name}</h1>
            {product.view_count > 0 && (
              <p className="pd__views">👁 {product.view_count.toLocaleString('ar-EG')} مشاهدة</p>
            )}

            {avgRating && (
              <div className="pd__rating">
                <span className="pd__stars">{'★'.repeat(Math.round(Number(avgRating)))}</span>
                <span>{avgRating} ({reviews.length} {t.reviews})</span>
              </div>
            )}

            <div className="pd__price-row">
              <span className="pd__price">{product.price.toFixed(2)} {t.sar}</span>
              {product.original_price && (
                <>
                  <span className="pd__original">{product.original_price.toFixed(2)} {t.sar}</span>
                  <span className="badge badge-primary">
                    -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                  </span>
                </>
              )}
            </div>

            <p className="pd__desc">{product.description_ar || product.description}</p>

            <div className="pd__stock">
              {product.stock > 0
                ? <span className="pd__in-stock">{t.inStock} ({product.stock} {t.unit})</span>
                : <span className="pd__out-stock">{t.outOfStock}</span>}
            </div>

            {product.bulk_min_qty && product.bulk_discount_pct && (
              <div className="pd__bulk-offer">
                🎁 عرض خاص: اشترِ {product.bulk_min_qty} قطع أو أكثر واحصل على خصم {product.bulk_discount_pct} ₪ على الإجمالي
              </div>
            )}

            {product.stock > 0 && (
              <div className="pd__actions">
                <div className="pd__qty">
                  <button onClick={() => setQty(q => clampNumber(q - 1, 1, product.stock))}>-</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(q => clampNumber(q + 1, 1, product.stock))}>+</button>
                </div>
                <button className="btn btn-primary pd__cart-btn" onClick={handleAddToCart}>
                  <ShoppingCart size={18} /> {t.addToCart}
                </button>
              </div>
            )}

            {product.tags?.length > 0 && (
              <div className="pd__tags">
                {product.tags.map((tag) => (
                  <span key={tag} className="pd__tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {related.length > 0 && (
          <div className="pd__related">
            <h2>منتجات مشابهة</h2>
            <div className="pd__related-slider">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        <div className="pd__reviews">
          <h2>{t.customerReviews}</h2>
          {user && (
            <form onSubmit={handleReviewSubmit} className="pd__review-form">
              <h3>{t.writeReview}</h3>
              <div className="pd__star-select">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} type="button"
                    className={n <= newReview.rating ? 'active' : ''}
                    onClick={() => setNewReview(r => ({ ...r, rating: n }))}>★</button>
                ))}
              </div>
              <div className="form-group">
                <label>{t.comment}</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview(r => ({ ...r, comment: e.target.value }))}
                  rows={3} maxLength={500} placeholder={t.shareExperience} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? t.submitting : t.submitReview}
              </button>
            </form>
          )}

          {reviews.length === 0
            ? <p className="pd__no-reviews">{t.noReviews}</p>
            : (
              <div className="pd__review-list">
                {reviews.map((r) => (
                  <div key={r.id} className="pd__review-item">
                    <div className="pd__review-header">
                      <strong>{r.profiles?.full_name || 'مجهول'}</strong>
                      <span className="pd__review-stars">{'★'.repeat(r.rating)}</span>
                      <span className="pd__review-date">
                        {new Date(r.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    <p>{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {lightbox && (
        <div className="pd__lightbox" onClick={() => setLightbox(false)}>
          <img src={allImages[activeImg]} alt={product.name_ar || product.name} onClick={(e) => e.stopPropagation()} />
          <button className="pd__lightbox-close" onClick={() => setLightbox(false)}>✕</button>
        </div>
      )}
    </div>
  );
}
