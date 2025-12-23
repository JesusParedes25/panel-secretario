/**
 * Layout Principal
 * Panel Secretario - Gobierno de Hidalgo
 */

import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  ArrowUpTrayIcon,
  InformationCircleIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('hidalgo');

  const navigation = [
    // Navegación deshabilitada - solo existe la página principal
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleTheme = () => {
    const newTheme = theme === 'hidalgo' ? 'hidalgo-dark' : 'hidalgo';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'hidalgo';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <header className="bg-primary text-primary-content shadow-lg sticky top-0 z-50">
        <div className="navbar container mx-auto px-4">
          {/* Mobile menu button */}
          <div className="navbar-start">
            <button
              className="btn btn-ghost lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
            
            {/* Logo y título */}
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="https://cdn.hidalgo.gob.mx/gobierno/images/logos/logo_gob.png" 
                alt="Gobierno del Estado de Hidalgo"
                className="h-12 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold leading-tight">
                  Panel de Simplificación
                </h1>
                <p className="text-xs opacity-90">Gobierno del Estado de Hidalgo</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1 gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`gap-2 ${
                        isActive(item.href)
                          ? 'bg-primary-dark text-white'
                          : 'hover:bg-primary-dark/50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Espacio vacío en navbar-end */}
          <div className="navbar-end">
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-primary-dark">
            <ul className="menu menu-vertical px-4 py-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`gap-3 ${
                        isActive(item.href) ? 'bg-secondary' : ''
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="content-wrapper container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Botón flotante para Carga de Datos - Solo ícono */}
      <Link
        to="/carga"
        className="fixed bottom-4 left-4 p-2.5 bg-white/70 hover:bg-white text-gray-500 hover:text-primary rounded-full shadow-sm hover:shadow-md border border-gray-200/50 transition-all duration-200 z-40 backdrop-blur-sm"
        title="Cargar datos CSV"
      >
        <ArrowUpTrayIcon className="h-4 w-4" />
      </Link>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-primary text-primary-content mt-16">
        <div>
          <p className="font-bold text-lg">
            Comisión Estatal de Mejora Regulatoria
          </p>
          <p className="text-sm opacity-90">
            Gobierno del Estado de Hidalgo
          </p>
          <p className="text-xs opacity-75 mt-2">
            © {new Date().getFullYear()} Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
