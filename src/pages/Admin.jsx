import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { sanitizeText, isPositiveNumber, clampNumber, isRateLimited } from '../utils/security';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Package, ShoppingBag, Upload, TrendingUp, X, Users } from 'lucide-react';
import './Admin.css';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'confirmed', label: 'تم التأكيد' },
  { value: 'preparing', label: 'جارٍ التحضير' },
  { value: 'out_for_delivery', label: 'في الطريق إليك' },
  { value: 'delivered', label: 'تم التوصيل' },
  { value: 'cancelled', label: 'ملغى' },
];
const EMPTY_PRODUCT = { name: '', slug: '', description: '', price: '', original_price: '', stock: '', image_url: '', is_featured: false, is_active: true, category_id: '' };

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState({ orders: 0, products: 0, revenue: 0 });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users_list, setUsersList] = useState([]);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [savingProd, setSavingProd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [useUrlFallback, setUseUrlFallback] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/');
  }, [user, isAdmin, loading]);

  useEffect(() => {
    if (tab === 'dashboard') loadStats();
    if (tab === 'products') { loadProducts(); loadCategories(); }
    if (tab === 'orders') loadOrders();
    if (tab === 'users') loadUsers();
  }, [tab]);

  const loadStats = async () => {
    const [{ count: ordersCount }, { count: productsCount }, { data: rev }] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total').neq('status', 'cancelled'),
    ]);
    const revenue = (rev || []).reduce((s, o) => s + Number(o.total), 0);
    setStats({ orders: ordersCount || 0, products: productsCount || 0, revenue });
  };

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
    setProducts(data || []);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    setCategories(data || []);
  };

  const loadOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, profiles(full_name, phone), order_items(product_name, quantity, price)')
      .order('created_at', { ascending: false });
    setOrders(data || []);
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setUsersList(data || []);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) { toast.error('الصورة أكبر من 5 ميغابايت'); return; }
    const ext = file.name.split('.').pop().toLowerCase();
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!allowed.includes(ext)) { toast.error('نوع ملف غير مدعوم'); return; }
    setUploading(true);
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) {
      toast.error('فشل رفع الصورة: ' + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
    setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    toast.success('تم رفع الصورة ✓');
    setUploading(false);
  };

  const handleProductSave = async (e) => {
    e.preventDefault();
    if (isRateLimited(`admin-product-${user.id}`, 20, 60_000)) { toast.error('Too many requests'); return; }
    const price = parseFloat(form.price);
    const original_price = form.original_price ? parseFloat(form.original_price) : null;
    const stock = parseInt(form.stock, 10);
    if (!sanitizeText(form.name) || !sanitizeText(form.slug)) { toast.error('Name and slug required'); return; }
    if (!isPositiveNumber(price)) { toast.error('Invalid price'); return; }
    if (isNaN(stock) || stock < 0) { toast.error('Invalid stock'); return; }

    const payload = {
      name: sanitizeText(form.name),
      slug: sanitizeText(form.slug).toLowerCase().replace(/\s+/g, '-'),
      description: sanitizeText(form.description),
      price: clampNumber(price, 0, 999999),
      original_price: original_price ? clampNumber(original_price, 0, 999999) : null,
      stock: clampNumber(stock, 0, 99999),
      image_url: sanitizeText(form.image_url),
      is_featured: !!form.is_featured,
      is_active: !!form.is_active,
      category_id: form.category_id || null,
    };

    setSavingProd(true);
    if (editId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editId);
      if (error) toast.error('Update failed: ' + error.message);
      else { toast.success('Product updated'); setShowForm(false); setEditId(null); setForm(EMPTY_PRODUCT); }
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) toast.error('Insert failed: ' + error.message);
      else { toast.success('Product created'); setShowForm(false); setForm(EMPTY_PRODUCT); }
    }
    setSavingProd(false);
    loadProducts();
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('Delete error:', error);
        toast.error('فشل الحذف: ' + error.message);
      } else {
        toast.success('تم حذف المنتج بنجاح');
        loadProducts();
      }
    } catch (err) {
      console.error('Delete exception:', err);
      toast.error('حدث خطأ غير متوقع');
    }
  };

  const handleOrderStatus = async (id, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) toast.error('Update failed'); else { toast.success('Status updated'); loadOrders(); }
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setForm({ ...p, price: String(p.price), original_price: p.original_price ? String(p.original_price) : '', stock: String(p.stock) });
    setShowForm(true);
  };

  if (loading) return <div className="spinner" style={{ marginTop: '4rem' }} />;
  if (!isAdmin) return null;

  return (
    <div className="admin">
      <div className="admin__sidebar">
        <h2>لوحة الإدارة</h2>
        {[
          { key: 'dashboard', icon: <TrendingUp size={18} />, label: t.dashboard },
          { key: 'products', icon: <Package size={18} />, label: t.products },
          { key: 'orders', icon: <ShoppingBag size={18} />, label: t.orders },
          { key: 'users', icon: <Users size={18} />, label: t.users },
        ].map((t) => (
          <button
            key={t.key}
            className={`admin__nav-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <main className="admin__main">
        {/* ---- Dashboard ---- */}
        {tab === 'dashboard' && (
          <div>
            <h1>{t.dashboard}</h1>
            <div className="admin__stats">
              <div className="admin__stat-card">
                <ShoppingBag size={28} />
                <div><strong>{stats.orders}</strong><span>{t.totalOrders}</span></div>
              </div>
              <div className="admin__stat-card">
                <Package size={28} />
                <div><strong>{stats.products}</strong><span>{t.products}</span></div>
              </div>
              <div className="admin__stat-card admin__stat-card--accent">
                <TrendingUp size={28} />
                <div><strong>{stats.revenue.toFixed(0)} {t.sar}</strong><span>{t.revenue}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ---- Products ---- */}
        {tab === 'products' && (
          <div>
            <div className="admin__tab-header">
              <h1>{t.products}</h1>
              <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_PRODUCT); }}>
                <Plus size={16} /> {t.addProduct}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleProductSave} className="admin__product-form">
                <h2>{editId ? t.editProduct : t.newProduct}</h2>
                <div className="grid-2">
                  <div className="form-group">
                    <label>{t.name} *</label>
                    <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} maxLength={120} required />
                  </div>
                  <div className="form-group">
                    <label>{t.slug} *</label>
                    <input type="text" value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} maxLength={120} required dir="ltr" />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t.description}</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} maxLength={1000} />
                </div>
                <div className="grid-3">
                  <div className="form-group">
                    <label>{t.price} *</label>
                    <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>{t.originalPrice}</label>
                    <input type="number" min="0" step="0.01" value={form.original_price} onChange={(e) => setForm(f => ({ ...f, original_price: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>{t.stock} *</label>
                    <input type="number" min="0" value={form.stock} onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>صورة المنتج</label>
                  {/* Upload button */}
                  {!useUrlFallback ? (
                    <div className="admin__img-upload">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload(e.target.files[0])}
                      />
                      <button
                        type="button"
                        className="btn btn-outline admin__upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <><div className="spinner spinner--sm" /> جارٍ الرفع...</>
                        ) : (
                          <><Upload size={16} /> رفع صورة</>
                        )}
                      </button>
                      {form.image_url && (
                        <div className="admin__img-preview">
                          <img src={form.image_url} alt="معاينة" />
                          <button type="button" className="admin__img-remove" onClick={() => setForm(f => ({ ...f, image_url: '' }))}>
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      <button type="button" className="admin__url-toggle" onClick={() => setUseUrlFallback(true)}>
                        أو أدخل رابط URL
                      </button>
                    </div>
                  ) : (
                    <div className="admin__img-upload">
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        <input
                          type="url"
                          value={form.image_url}
                          onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
                          maxLength={500}
                          dir="ltr"
                          placeholder="https://..."
                          style={{ flex: 1 }}
                        />
                      </div>
                      <button type="button" className="admin__url-toggle" onClick={() => setUseUrlFallback(false)}>
                        أو ارفع صورة من جهازك
                      </button>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>{t.category}</label>
                  <select value={form.category_id} onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">-- بدون --</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="admin__checkboxes">
                  <label><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm(f => ({ ...f, is_featured: e.target.checked }))} /> {t.featured}</label>
                  <label><input type="checkbox" checked={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))} /> {t.active}</label>
                </div>
                <div className="admin__form-actions">
                  <button type="submit" className="btn btn-primary" disabled={savingProd || uploading}>{savingProd ? t.saving : editId ? t.update : t.create}</button>
                  <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setEditId(null); setUseUrlFallback(false); }}>{t.cancel}</button>
                </div>
              </form>
            )}

            <div className="admin__table-wrap">
              <table className="admin__table">
                <thead>
                  <tr><th>{t.image}</th><th>{t.name}</th><th>{t.price}</th><th>{t.stock}</th><th>{t.featured}</th><th>{t.status}</th><th></th></tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td><img src={p.image_url} alt={p.name} className="admin__prod-thumb" /></td>
                      <td><strong>{p.name_ar || p.name}</strong><br /><small>{p.categories?.name}</small></td>
                      <td>{p.price} {t.sar}</td>
                      <td>{p.stock}</td>
                      <td>{p.is_featured ? '★' : '—'}</td>
                      <td><span className={`admin__status-dot ${p.is_active ? 'active' : 'inactive'}`}>{p.is_active ? 'نشط' : 'غير نشط'}</span></td>
                      <td>
                        <button className="admin__action-btn" onClick={() => startEdit(p)}><Edit2 size={15} /></button>
                        <button className="admin__action-btn admin__action-btn--danger" onClick={() => handleDeleteProduct(p.id)}><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---- Orders ---- */}
        {tab === 'orders' && (
          <div>
            <h1>{t.orders}</h1>
            <div className="admin__table-wrap">
              <table className="admin__table">
                <thead>
                  <tr><th>#</th><th>{t.customer}</th><th>{t.items}</th><th>{t.total}</th><th>{t.status}</th><th>{t.date}</th></tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td><small>#{o.id.slice(-8).toUpperCase()}</small></td>
                      <td>{o.profiles?.full_name || 'زائر'}</td>
                      <td>{o.order_items?.length || 0} {t.items}</td>
                      <td><strong>{o.total} {t.sar}</strong></td>
                      <td>
                        <select
                          value={o.status}
                          onChange={(e) => handleOrderStatus(o.id, e.target.value)}
                          className="admin__status-select"
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </td>
                      <td><small>{new Date(o.created_at).toLocaleDateString()}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---- Users ---- */}
        {tab === 'users' && (
          <div>
            <h1>{t.users}</h1>
            <div className="admin__table-wrap">
              <table className="admin__table">
                <thead>
                  <tr>
                    <th>{t.name}</th>
                    <th>{t.email}</th>
                    <th>{t.phone}</th>
                    <th>{t.status}</th>
                    <th>{t.date}</th>
                  </tr>
                </thead>
                <tbody>
                  {users_list.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.full_name || '—'}</strong></td>
                      <td>{u.email || '—'}</td>
                      <td>{u.phone || '—'}</td>
                      <td>
                        <span className={`admin__status-dot ${u.role === 'admin' ? 'active' : 'inactive'}`}>
                          {u.role === 'admin' ? 'مدير' : 'عميل'}
                        </span>
                      </td>
                      <td><small>{new Date(u.created_at).toLocaleDateString()}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
