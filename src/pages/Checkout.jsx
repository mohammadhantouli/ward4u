import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { supabase } from '../lib/supabase';
import { sanitizeText, clampNumber, isRateLimited } from '../utils/security';
import toast from 'react-hot-toast';
import './Checkout.css';

const getEffectivePrice = (item) =>
  item.bulk_min_qty && item.bulk_discount_pct && item.quantity >= item.bulk_min_qty
    ? Math.max(0, (item.price * item.quantity - item.bulk_discount_pct) / item.quantity)
    : item.price;

const sendWhatsAppNotification = async (order, address, orderItems) => {
  const instance = import.meta.env.VITE_GREENAPI_INSTANCE;
  const token = import.meta.env.VITE_GREENAPI_TOKEN;
  const ownerPhone = import.meta.env.VITE_OWNER_WHATSAPP;
  if (!instance || !token || !ownerPhone) return;

  const chatId = `${ownerPhone}@c.us`;
  const base = `https://api.green-api.com/waInstance${instance}`;

  const itemLines = orderItems
    .map((i) => `• ${i.product_name} ×${i.quantity} — ${(i.price * i.quantity).toFixed(2)} ₪`)
    .join('\n');

  const caption =
    `🌸 طلب جديد #${order.id.slice(0, 8)}\n\n` +
    `👤 الاسم: ${address.name}\n` +
    `📞 الجوال: ${address.phone}\n` +
    `📍 العنوان: ${address.city}${address.district ? '، ' + address.district : ''}، ${address.street}\n` +
    (address.notes ? `📝 ملاحظات: ${address.notes}\n` : '') +
    `\n🛒 المنتجات:\n${itemLines}\n\n` +
    `💰 الإجمالي: ${order.total.toFixed(2)} ₪\n` +
    `💳 الدفع: عند الاستلام`;

  const images = orderItems.filter((i) => i.image_url);

  try {
    // Send each product image separately
    for (const item of images) {
      await fetch(`${base}/sendFileByUrl/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          urlFile: item.image_url,
          fileName: 'product.jpg',
          caption: `${item.product_name} ×${item.quantity}`,
        }),
      });
    }
    // Send full order details as text
    const res = await fetch(`${base}/sendMessage/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message: caption }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error('[WhatsApp] send failed:', res.status, errBody);
    }
  } catch (err) {
    console.error('[WhatsApp] network error:', err);
  }
};

export default function Checkout() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useLang();
  const { items, clearCart } = useCartStore();
  const subtotal = items.reduce((s, i) => s + getEffectivePrice(i) * i.quantity, 0);

  const [form, setForm] = useState({
    name: profile?.full_name || '',
    phone: '',
    city: '',
    district: '',
    street: '',
    notes: '',
    payment: 'cash_on_delivery',
  });
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) { navigate('/cart'); return null; }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const errs = {};
    if (!sanitizeText(form.name) || sanitizeText(form.name).length < 2) errs.name = 'أدخل اسمك الكامل';
    if (!form.phone || form.phone.trim().length < 6) errs.phone = 'أدخل رقم هاتف صحيح';
    if (!sanitizeText(form.city))   errs.city   = 'المدينة مطلوبة';
    if (!sanitizeText(form.street)) errs.street = 'العنوان مطلوب';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRateLimited(`checkout-${user?.id || 'guest'}`, 3, 120_000)) {
      toast.error('محاولات كثيرة. انتظر قليلاً.');
      return;
    }
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const deliveryAddress = {
        name:     sanitizeText(form.name),
        phone:    sanitizeText(form.phone),
        city:     sanitizeText(form.city),
        district: sanitizeText(form.district),
        street:   sanitizeText(form.street),
        notes:    sanitizeText(form.notes),
      };

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          total: subtotal,
          delivery_fee: 0,
          delivery_address: deliveryAddress,
          payment_method: form.payment,
          notes: sanitizeText(form.notes),
          status: 'pending',
        })
        .select().single();

      if (orderErr) throw orderErr;

      const orderItems = items.map((i) => ({
        order_id:     order.id,
        product_id:   i.id,
        product_name: sanitizeText(i.name_ar || i.name),
        price:        clampNumber(getEffectivePrice(i), 0, 999999),
        quantity:     clampNumber(i.quantity, 1, 99),
        image_url:    i.image_url,
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
      if (itemsErr) throw itemsErr;

      clearCart();
      sendWhatsAppNotification(order, deliveryAddress, orderItems);
      toast.success('تم تأكيد طلبك بنجاح!');
      navigate(user ? '/orders' : '/');
    } catch (err) {
      console.error('[Checkout error]', err);
      toast.error(err?.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout">
      <div className="container">
        <h1 className="checkout__title">{t.checkoutTitle}</h1>
        <div className="checkout__layout">
          <form onSubmit={handleSubmit} className="checkout__form" noValidate>
            <div className="checkout__section">
              <h2>{t.deliveryDetails}</h2>
              <div className="form-group">
                <label>{t.fullName} *</label>
                <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={80} placeholder="اسمك الكامل" />
                {errors.name && <span className="error-msg">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label>{t.phone} *</label>
                <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="رقم الهاتف" maxLength={20} dir="ltr" />
                {errors.phone && <span className="error-msg">{errors.phone}</span>}
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>{t.city} *</label>
                  <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} maxLength={60} />
                  {errors.city && <span className="error-msg">{errors.city}</span>}
                </div>
                <div className="form-group">
                  <label>{t.district}</label>
                  <input type="text" value={form.district} onChange={(e) => set('district', e.target.value)} maxLength={60} />
                </div>
              </div>
              <div className="form-group">
                <label>{t.street} *</label>
                <input type="text" value={form.street} onChange={(e) => set('street', e.target.value)} maxLength={120} />
                {errors.street && <span className="error-msg">{errors.street}</span>}
              </div>
              <div className="form-group">
                <label>{t.notes}</label>
                <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} maxLength={300} placeholder={t.notesPlaceholder} />
              </div>
            </div>

            <div className="checkout__section">
              <h2>{t.paymentMethod}</h2>
              <label className="checkout__radio">
                <input type="radio" name="payment" value="cash_on_delivery" checked readOnly />
                {t.cashOnDelivery}
              </label>
            </div>

            <button type="submit" className="btn btn-primary checkout__submit" disabled={submitting}>
              {submitting ? t.placingOrder : `${t.placeOrder} — ${subtotal.toFixed(2)} ${t.sar}`}
            </button>
          </form>

          <div className="checkout__summary">
            <h2>{t.yourOrder}</h2>
            {items.map((i) => (
              <div key={i.id} className="checkout__item">
                <img src={i.image_url} alt={i.name} />
                <div>
                  <p>{i.name_ar || i.name}</p>
                  <small>×{i.quantity}</small>
                </div>
                <span>{(getEffectivePrice(i) * i.quantity).toFixed(2)} {t.sar}</span>
              </div>
            ))}
            <div className="checkout__totals">
              <div className="checkout__total-row"><span>{t.subtotal}</span><span>{subtotal.toFixed(2)} {t.sar}</span></div>
              <div className="checkout__total-row"><span>{t.delivery}</span><span style={{ fontSize: '.85rem', color: 'var(--color-text-muted)' }}>يعتمد على المكان</span></div>
              <div className="checkout__total-row checkout__total-row--bold">
                <strong>{t.total}</strong><strong>{subtotal.toFixed(2)} {t.sar}</strong>
              </div>
              <p style={{ fontSize: '.78rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '.25rem' }}>لا يشمل رسوم التوصيل</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
