import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Register() {
  const [form, setForm] = useState({ username: '', email: '', fullName: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ثبت‌نام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-icon">📝</div>
        <h2>ثبت‌نام</h2>
        <p className="auth-subtitle">حساب کاربری جدید بسازید</p>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid #fecaca'
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>نام کاربری</label>
            <input name="username" placeholder="نام کاربری" onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>ایمیل</label>
            <input name="email" placeholder="ایمیل" onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>نام کامل</label>
            <input name="fullName" placeholder="نام کامل" onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>رمز عبور</label>
            <input name="password" type="password" placeholder="رمز عبور (حداقل ۶ کاراکتر)" onChange={handleChange} required />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            disabled={loading}
          >
            {loading ? 'در حال ثبت...' : 'ثبت‌نام'}
          </button>
        </form>

        <div className="auth-link">
          قبلاً ثبت‌نام کرده‌اید؟ <Link to="/login">ورود</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;