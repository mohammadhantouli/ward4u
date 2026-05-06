import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { supabase } from '../lib/supabase';
import { sanitizeText, isValidPhone } from '../utils/security';
import toast from 'react-hot-toast';
import './Profile.css';

export default function Profile() {
  const { user, profile, fetchProfile } = useAuth();
  const { t } = useLang();
  const [form, setForm]     = useState({ full_name: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', phone: profile.phone || '' });
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = {};
    const name = sanitizeText(form.full_name);
    if (!name || name.length < 2)                errs.full_name = 'الاسم مطلوب';
    if (form.phone && !isValidPhone(form.phone)) errs.phone     = 'رقم الجوال غير صحيح';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name, phone: sanitizeText(form.phone) })
      .eq('id', user.id);

    if (error) toast.error('فشل تحديث الملف الشخصي.');
    else { toast.success('تم حفظ التغييرات!'); await fetchProfile(user.id); }
    setSaving(false);
  };

  if (!user) return <div style={{ textAlign: 'center', padding: '4rem' }}>يرجى تسجيل الدخول.</div>;

  return (
    <div className="profile-page">
      <div className="container">
        <h1 className="profile__title">{t.profileTitle}</h1>

        <div className="profile__card">
          <div className="profile__avatar">
            {profile?.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <p className="profile__email">{user.email}</p>
          <span className="badge badge-primary">
            {profile?.role === 'admin' ? 'مدير' : 'عميل'}
          </span>
        </div>

        <div className="profile__form-card">
          <h2>{t.editProfile}</h2>
          <form onSubmit={handleSave} noValidate>
            <div className="form-group">
              <label>{t.fullName}</label>
              <input type="text" value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} maxLength={80} />
              {errors.full_name && <span className="error-msg">{errors.full_name}</span>}
            </div>
            <div className="form-group">
              <label>{t.phone}</label>
              <input type="tel" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="05xxxxxxxx" maxLength={15} dir="ltr" />
              {errors.phone && <span className="error-msg">{errors.phone}</span>}
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? t.saving : t.saveChanges}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
