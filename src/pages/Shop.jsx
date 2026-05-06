import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LangContext';
import { sanitizeSearch, sanitizeURLParam, isRateLimited } from '../utils/security';
import ProductCard from '../components/ui/ProductCard';
import './Shop.css';

const PAGE_SIZE = 12;

export default function Shop() {
  const { t } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const q = sanitizeSearch(searchParams.get('q') || '');
  const cat = sanitizeURLParam(searchParams.get('cat') || '');
  const sort = searchParams.get('sort') || 'created_at-desc';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const [sortField, sortDir] = sort.split('-');

  const SORT_OPTIONS = [
    { value: 'created_at-desc', label: t.sortNewest },
    { value: 'price-asc', label: t.sortPriceLow },
    { value: 'price-desc', label: t.sortPriceHigh },
    { value: 'name-asc', label: t.sortNameAZ },
  ];

  const fetchProducts = useCallback(async () => {
    if (isRateLimited('shop-fetch', 150, 60_000)) { setLoading(false); return; }
    setLoading(true);

    let query = supabase
      .from('products')
      .select('*, categories(name, name_ar, slug)', { count: 'exact' })
      .eq('is_active', true)
      .order(sortField, { ascending: sortDir === 'asc' })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (q) query = query.ilike('name', `%${q}%`);
    if (cat) {
      const { data: catRow } = await supabase
        .from('categories').select('id').eq('slug', cat).single();
      if (catRow) query = query.eq('category_id', catRow.id);
    }

    const { data, count } = await query;
    setProducts(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [q, cat, sort, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => setCategories(data || []));
  }, []);

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const [localSearch, setLocalSearch] = useState(q);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setParam('q', sanitizeSearch(localSearch));
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="shop">
      <div className="shop__header">
        <div className="container">
          <h1>{t.shopTitle}</h1>
          <p>{total} {t.available}</p>
        </div>
      </div>

      <div className="container shop__layout">
        {/* Sidebar */}
        <aside className={`shop__sidebar ${filterOpen ? 'shop__sidebar--open' : ''}`}>
          <div className="shop__sidebar-header">
            <h3>{t.filters}</h3>
            <button className="shop__sidebar-close" onClick={() => setFilterOpen(false)}><X size={20} /></button>
          </div>

          <form onSubmit={handleSearchSubmit} className="shop__filter-search">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              maxLength={100}
            />
            <button type="submit"><Search size={16} /></button>
          </form>

          <div className="shop__filter-group">
            <h4>{t.categories}</h4>
            <button
              className={`shop__filter-btn ${!cat ? 'shop__filter-btn--active' : ''}`}
              onClick={() => setParam('cat', '')}
            >{t.allCategories}</button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={`shop__filter-btn ${cat === c.slug ? 'shop__filter-btn--active' : ''}`}
                onClick={() => setParam('cat', c.slug)}
              >{c.name}</button>
            ))}
          </div>

          {q && (
            <button className="shop__clear-filter" onClick={() => { setParam('q', ''); setLocalSearch(''); }}>
              <X size={14} /> {t.clearSearch}: "{q}"
            </button>
          )}
        </aside>

        {/* Main */}
        <main className="shop__main">
          <div className="shop__toolbar">
            <button className="shop__filter-toggle btn btn-outline" onClick={() => setFilterOpen(true)}>
              <Filter size={16} /> {t.filters}
            </button>
            <select
              className="shop__sort"
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="spinner" />
          ) : products.length === 0 ? (
            <div className="shop__empty">
              <p>{t.noProducts}</p>
              <button className="btn btn-primary" onClick={() => setSearchParams({})}>{t.clearFilters}</button>
            </div>
          ) : (
            <div className="grid-4 shop__grid">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="shop__pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`shop__page-btn ${n === page ? 'shop__page-btn--active' : ''}`}
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set('page', n);
                    setSearchParams(p);
                  }}
                >{n}</button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
