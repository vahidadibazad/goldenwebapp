import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // ✅ اضافه شد
import api from '../services/api';
import { showSuccess, showError } from './Toast';
import { toPersianNumber } from '../utils/numberHelper';

function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) return;
    try {
      await api.delete(`/categories/${id}`);
      showSuccess('دسته‌بندی با موفقیت حذف شد');
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || 'خطا در حذف');
    }
  };

  if (loading)
    return (
      <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
        در حال بارگذاری...
      </p>
    );

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          📂 مدیریت دسته‌بندی‌ها
          <span>{toPersianNumber(categories.length)}</span>
        </div>
        <Link to="/categories/new" className="btn btn-primary">
          ➕ افزودن دسته‌بندی جدید
        </Link>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>نام</th>
              <th>زیردسته‌ها</th>
              <th>توضیحات</th>
              <th style={{ textAlign: 'center' }}>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat._id}>
                <td>
                  <strong>
                    {cat.icon} {cat.name}
                  </strong>
                </td>
                <td>{cat.subcategories?.join('، ') || '-'}</td>
                <td>{cat.description || '-'}</td>
                <td style={{ textAlign: 'center' }}>
                  <Link
                    to={`/categories/edit/${cat._id}`}
                    className="btn btn-warning"
                    style={{ padding: '6px 12px', marginLeft: '6px' }}
                  >
                    ✏️
                  </Link>
                  <button
                    onClick={() => handleDelete(cat._id)}
                    className="btn btn-danger"
                    style={{ padding: '6px 12px' }}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CategoryList;