import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import './Orders.css';

const STATUS_COLORS = {
  pending:          '#f0ad4e',
  confirmed:        '#5bc0de',
  preparing:        '#337ab7',
  out_for_delivery: '#7A8C3E',
  delivered:        '#5cb85c',
  cancelled:        '#d9534f',
};

export default function Orders() {
  const { user } = useAuth();
  const { t } = useLang();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*, order_items(product_name, quantity, price, image_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setOrders(data || []); setLoading(false); });
  }, [user]);

  if (!user) return (
    <div className="orders-login">
      <p>يرجى <Link to="/auth">تسجيل الدخول</Link> لعرض طلباتك.</p>
    </div>
  );

  if (loading) return <div className="spinner" style={{ marginTop: '4rem' }} />;

  if (orders.length === 0) return (
    <div className="orders-empty">
      <h2>{t.noOrders}</h2>
      <p>{t.noOrdersSub}</p>
      <Link to="/shop" className="btn btn-primary">{t.shopNow}</Link>
    </div>
  );

  return (
    <div className="orders">
      <div className="container">
        <h1 className="orders__title">{t.ordersTitle}</h1>
        <div className="orders__list">
          {orders.map((order) => {
            const statusLabel = t.statusLabels[order.status] || order.status;
            const statusColor = STATUS_COLORS[order.status] || '#999';
            return (
              <div key={order.id} className="order-card">
                <div className="order-card__header">
                  <div>
                    <span className="order-card__id">طلب #{order.id.slice(-8).toUpperCase()}</span>
                    <span className="order-card__date">
                      {new Date(order.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  <span className="order-card__status" style={{ background: statusColor }}>
                    {statusLabel}
                  </span>
                </div>

                <div className="order-card__items">
                  {order.order_items?.map((item, i) => (
                    <div key={i} className="order-card__item">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          onClick={() => setLightbox(item.image_url)}
                          className="order-card__item-img"
                        />
                      )}
                      <span>{item.product_name}</span>
                      <span>×{item.quantity}</span>
                      <span>{(item.price * item.quantity).toFixed(2)} {t.sar}</span>
                    </div>
                  ))}
                </div>

                <div className="order-card__footer">
                  <span>{t.total}: <strong>{order.total.toFixed(2)} {t.sar}</strong></span>
                  <span className="order-card__payment">
                    {order.payment_method === 'cash_on_delivery' ? 'نقداً عند الاستلام' : 'بطاقة عند الاستلام'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {lightbox && (
        <div className="orders__lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="معاينة" onClick={(e) => e.stopPropagation()} />
          <button className="orders__lightbox-close" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
