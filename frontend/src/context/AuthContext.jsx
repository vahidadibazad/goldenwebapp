import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // تابع برای بارگذاری اطلاعات از localStorage
  const loadUserData = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const perms = localStorage.getItem('permissions');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        let permsArray = perms ? JSON.parse(perms) : [];
        
        // اگر کاربر ادمین است و مجوزها خالی است، همه مجوزها را به او بده
        if (parsedUser.role?.name === 'admin' && permsArray.length === 0) {
          permsArray = [
            'view_hardware', 'create_hardware', 'edit_hardware', 'delete_hardware',
            'view_credential', 'create_credential', 'edit_credential', 'delete_credential',
            'view_document', 'upload_document', 'delete_document',
            'view_ticket', 'create_ticket', 'edit_ticket', 'delete_ticket',
            'view_user', 'create_user', 'edit_user', 'delete_user',
            'view_category', 'create_category', 'edit_category', 'delete_category',
            'view_audit', 'manage_roles', 'manage_permissions'
          ];
          localStorage.setItem('permissions', JSON.stringify(permsArray));
        }
        
        setPermissions(permsArray);
      } catch (error) {
        console.error('خطا در خواندن اطلاعات کاربر:', error);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // =============================================
  // تابع برای به‌روزرسانی اطلاعات کاربر بعد از لاگین
  // =============================================
  const updateUser = (newUser, newPermissions) => {
    setUser(newUser);
    if (newPermissions !== undefined) {
      setPermissions(newPermissions);
    }
  };

  const hasPermission = (permissionName) => {
    if (user?.role?.name === 'admin') return true;
    return permissions.includes(permissionName);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('permissions');
    setUser(null);
    setPermissions([]);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser: updateUser,
      permissions, 
      setPermissions,
      hasPermission, 
      logout, 
      loading,
      loadUserData,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };