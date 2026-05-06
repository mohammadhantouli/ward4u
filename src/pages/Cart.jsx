import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useLang } from '../context/LangContext';
import './Cart.css';

const DELIVERY_FEE = 25;

export default function Cart() {
  const { t } = useLang();
  const { items, removeItem, updateQuantity } = useCartStore();
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + (items.length ? DELIVERY_FEE : 0);

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
                  <p className="cart-item__price">{item.price.toFixed(2)} {t.sar}</p>
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
                <span className="cart-item__subtotal">{(item.price * item.quantity).toFixed(2)} {t.sar}</span>
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
              <span>{t.delivery}</span><span>{DELIVERY_FEE.toFixed(2)} {t.sar}</span>
            </div>
            <div className="cart__summary-row cart__summary-total">
              <strong>{t.total}</strong><strong>{total.toFixed(2)} {t.sar}</strong>
            </div>
            <Link to="/checkout" className="btn btn-primary cart__checkout-btn">{t.checkout}</Link>
            <Link to="/shop" className="btn btn-outline cart__continue-btn">{t.continueShopping}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
