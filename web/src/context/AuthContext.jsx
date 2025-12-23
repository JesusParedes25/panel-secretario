/**
 * Contexto de Autenticación
 * Panel Secretario - Gobierno de Hidalgo
 */

import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar si hay sesión guardada al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await apiService.getMe();
          setUser(response.data.data);
        } catch (err) {
          // Token inválido o expirado
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await apiService.login(username, password);
      
      if (response.data.success) {
        const { token, user: userData } = response.data.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      } else {
        setError(response.data.error);
        return { success: false, error: response.data.error };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error al iniciar sesión';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  const isAdmin = () => {
    return user?.rol === 'admin';
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAdmin,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
