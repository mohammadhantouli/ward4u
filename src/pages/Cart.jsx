import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useLang } from '../context/LangContext';
import './Cart.css';

const getEffectivePrice = (item) =>
  item.bulk_min_qty && item.bulk_discount_pct && item.quantity >= item.bulk_min_qty
    ? Math.max(0, (item.price * item.quantity - item.bulk_discount_pct) / item.quantity)
    : item.price;

export default function Cart() {
  const { t } = useLang();
  const { items, removeItem, updateQuantity } = useCartStore();
  const subtotal = items.reduce((s, i) => s + getEffectivePrice(i) * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <ShoppingBag size={64} className="cart-empty__icon" />
        <h2>{t.cartEmpty}</h2>
        <p>{t.cartEmptySub}</p>
        <Link to="/shop" className="btn btn-primary">{t.shopNow}</Link>
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="container">
        <h1 className="cart__title">{t.cartTitle}</h1>
        <div className="cart__layout">
          <div className="cart__items">
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image_url} alt={item.name} className="cart-item__img" />
                <div className="cart-item__info">
                  <h3>{item.name_ar || item.name}</h3>
                  {item.bulk_min_qty && item.bulk_discount_pct && item.quantity >= item.bulk_min_qty ? (
                    <p className="cart-item__price">
                      <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '.85rem', marginLeft: '.3rem' }}>{item.price.toFixed(2)}</span>
                      <span style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>{getEffectivePrice(item).toFixed(2)} {t.sar}</span>
                      <span className="cart-item__bulk-badge">خصم {item.bulk_discount_pct} ر.س</span>
                    </p>
                  ) : (
                    <p className="cart-item__price">
                      {item.price.toFixed(2)} {t.sar}
                      {item.bulk_min_qty && item.bulk_discount_pct && (
                        <span className="cart-item__bulk-hint">أضف {item.bulk_min_qty - item.quantity} أكثر لخصم {item.bulk_discount_pct} ر.س</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="cart-item__qty">
                  <button onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}>
                    <Minus size={14} />
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    <Plus size={14} />
                  </button>
                </div>
                <span className="cart-item__subtotal">{(getEffectivePrice(item) * item.quantity).toFixed(2)} {t.sar}</span>
                <button className="cart-item__remove" onClick={() => removeItem(item.id)} aria-label="حذف">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="cart__summary">
            <h2>{t.yourOrder}</h2>
            <div className="cart__summary-row">
              <span>{t.subtotal}</span><span>{subtotal.toFixed(2)} {t.sar}</span>
            </div>
            <div className="cart__summary-row">
              <span>{t.delivery}</span><span style={{ fontSize: '.85rem', color: 'var(--color-text-muted)' }}>يعتمد على المكان</span>
            </div>
            <div className="cart__summary-row cart__summary-total">
              <strong>{t.total}</strong><strong>{subtotal.toFixed(2)} {t.sar}</strong>
            </div>
            <p style={{ fontSize: '.78rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '.25rem' }}>لا يشمل رسوم التوصيل</p>
            <Link to="/checkout" className="btn btn-primary cart__checkout-btn">{t.checkout}</Link>
            <Link to="/shop" className="btn btn-outline cart__continue-btn">{t.continueShopping}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
