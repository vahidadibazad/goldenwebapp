import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom'; // ✅ Link اضافه شد
import api from '../services/api';
import { showSuccess, showError } from './Toast';

function CategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    subcategories: '',
    description: '',
    icon: '📁',
  });

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        try {
          const res = await api.get(`/categories/${id}`);
          const data = res.data.data;
          setForm({
            name: data.name,
            subcategories: data.subcategories?.join('، ') || '',
            description: data.description || '',
            icon: data.icon || '📁',
          });
        } catch (err) {
          showError('خطا در دریافت اطلاعات');
        }
      };
      fetchData();
    }
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        subcategories: form.subcategories ? form.subcategories.split('،').map((s) => s.trim()) : [],
      };

      if (id) {
        await api.put(`/categories/${id}`, payload);
        showSuccess('دسته‌بندی با موفقیت ویرایش شد');
      } else {
        await api.post('/categories', payload);
        showSuccess('دسته‌بندی با موفقیت ثبت شد');
      }
      navigate('/categories');
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ثبت');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="page-title" style={{ fontSize: '20px', marginBottom: '24px' }}>
        {id ? '✏️ ویرایش دسته‌بندی' : '➕ افزودن دسته‌بندی جدید'}
      </div>

      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid #fecaca',
          }}
        >
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>نام دسته‌بندی</label>
          <input
            name="name"
            placeholder="مثلاً: مالی، فنی، پرسنلی"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label>زیردسته‌ها</label>
          <input
            name="subcategories"
            placeholder="مثلاً: فاکتورها، قراردادها (با ، جدا کنید)"
            value={form.subcategories}
            onChange={handleChange}
          />
          <small style={{ color: '#64748b', fontSize: '12px', display: 'block', marginTop: '4px' }}>
            زیردسته‌ها را با کاما (،) جدا کنید
          </small>
        </div>

        <div className="input-group">
          <label>آیکون</label>
          <input
            name="icon"
            placeholder="مثلاً: 📁، 📊، 👥"
            value={form.icon}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <label>توضیحات</label>
          <textarea
            name="description"
            rows="3"
            placeholder="توضیحات اختیاری"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'در حال ثبت...' : 'ذخیره'}
          </button>
          <Link to="/categories" className="btn btn-outline">
            بازگشت
          </Link>
        </div>
      </form>
    </div>
  );
}

export default CategoryForm;