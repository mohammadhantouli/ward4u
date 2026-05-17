import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { sanitizeText, isValidEmail, isRateLimited } from '../utils/security';
import toast from 'react-hot-toast';
import authLogo from '../assets/logo.png';
import './Auth.css';

export default function Auth() {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate(redirect); }, [user]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const errs = {};
    if (!isValidEmail(form.email)) errs.email = 'أدخل بريداً إلكترونياً صحيحاً';
    if (form.password.length < 8)  errs.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    if (mode === 'register') {
      const name = sanitizeText(form.name);
      if (!name || name.length < 2)              errs.name = 'أدخل اسمك الكامل';
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'كلمتا المرور غير متطابقتين';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Rate limiting: 3 attempts per 5 mins for registration, 5 for login
    const rateLimitKey = mode === 'register' ? 'auth-reg-global' : `auth-login-${form.email.trim().toLowerCase()}`;
    const maxAttempts = mode === 'register' ? 3 : 5;
    
    if (isRateLimited(rateLimitKey, maxAttempts, 300_000)) {
      toast.error(mode === 'register' 
        ? 'محاولات إنشاء حساب كثيرة جداً من هذا الجهاز. انتظر 5 دقائق.' 
        : 'محاولات دخول كثيرة جداً. انتظر 5 دقائق.');
      return;
    }
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
        if (error) { toast.error('بيانات الدخول غير صحيحة'); return; }
        toast.success('مرحباً بعودتك!');
        navigate(redirect);
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          options: { data: { full_name: sanitizeText(form.name) } },
        });
        if (error) { toast.error(error.message); return; }
        toast.success('تم إنشاء الحساب! تحقق من بريدك الإلكتروني.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <Link to="/" className="auth-logo">
            <img src={authLogo} alt="Ward 4U" className="auth-logo__img" />
          </Link>
          <h1>{mode === 'login' ? t.welcomeBack : t.createAccount}</h1>
          <p>{mode === 'login' ? t.signInSub : t.createAccountSub}</p>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setErrors({}); }}>
            {t.loginBtn}
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setErrors({}); }}>
            {t.registerBtn}
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <div className="form-group">
              <label>{t.fullName}</label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                placeholder="اسمك الكامل" maxLength={80} />
              {errors.name && <span className="error-msg">{errors.name}</span>}
            </div>
          )}
          <div className="form-group">
            <label>{t.email}</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
              placeholder="your@email.com" maxLength={150} autoComplete="email" dir="ltr" />
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label>{t.password}</label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
              placeholder={t.passwordMin} maxLength={128}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} dir="ltr" />
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>
          {mode === 'register' && (
            <div className="form-group">
              <label>{t.confirmPassword}</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)}
                placeholder="أعد كتابة كلمة المرور" maxLength={128} autoComplete="new-password" dir="ltr" />
              {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword}</span>}
            </div>
          )}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? t.pleaseWait : mode === 'login' ? t.loginBtn : t.registerBtn}
          </button>
        </form>
      </div>
    </div>
  );
}
