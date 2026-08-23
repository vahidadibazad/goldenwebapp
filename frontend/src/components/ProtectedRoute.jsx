// frontend/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Spin } from 'antd';

function ProtectedRoute({ children, requiredRole }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // بررسی احراز هویت
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token) {
      setIsAuthenticated(true);
      setUserRole(user?.role?.name || user?.role || 'user');
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--bg-secondary)'
      }}>
        <Spin size="large" description="در حال بررسی احراز هویت..." />
      </div>
    );
  }

  // ✅ اگر توکن وجود نداشت، به لاگین برو
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ اگر نقش مورد نیاز بود و کاربر آن نقش را نداشت
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;