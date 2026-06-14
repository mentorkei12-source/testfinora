import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedAdmin = localStorage.getItem('admin');

    if (token && storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }
    if (token && storedAdmin) {
      try { setAdmin(JSON.parse(storedAdmin)); } catch {}
    }
    setLoading(false);
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.removeItem('admin');
    setUser(userData);
    setAdmin(null);
  };

  const loginAdmin = (token, adminData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('admin', JSON.stringify(adminData));
    localStorage.removeItem('user');
    setAdmin(adminData);
    setUser(null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    setUser(null);
    setAdmin(null);
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, admin, loading, loginUser, loginAdmin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
