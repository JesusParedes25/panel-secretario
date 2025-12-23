/**
 * Página de Login
 * Panel Secretario - Gobierno de Hidalgo
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LockClosedIcon, 
  UserIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await login(username, password);
    
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#9F2241] via-[#691C32] to-[#235B4E] p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <img 
            src="https://cdn.hidalgo.gob.mx/gobierno/images/logos/logo_gob.png" 
            alt="Gobierno del Estado de Hidalgo"
            className="h-20 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white">
            Panel de Simplificación
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Acceso Administrativo
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error */}
            {error && (
              <div className="alert alert-error">
                <ExclamationCircleIcon className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Usuario */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Usuario</span>
              </label>
              <div className="relative">
                <UserIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ingrese su usuario"
                  className="input input-bordered w-full pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Contraseña</span>
              </label>
              <div className="relative">
                <LockClosedIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="Ingrese su contraseña"
                  className="input input-bordered w-full pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Link a dashboard público */}
          <div className="mt-6 text-center">
            <a 
              href="/" 
              className="text-sm text-gray-500 hover:text-primary transition-colors"
            >
              ← Volver al Dashboard Público
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/50 text-xs mt-6">
          © {new Date().getFullYear()} Gobierno del Estado de Hidalgo
        </p>
      </div>
    </div>
  );
};

export default Login;
