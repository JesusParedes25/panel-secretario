/**
 * Componente Principal de la Aplicación
 * Panel Secretario - Gobierno de Hidalgo
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout';
import ParticlesBackground from './components/ParticlesBackground';

// Páginas
import Dashboard from './pages/Dashboard';
import Dependencias from './pages/Dependencias';
import Tramites from './pages/Tramites';
import Carga from './pages/Carga';
import Acerca from './pages/Acerca';

function App() {
  const [particlesEnabled, setParticlesEnabled] = useState(
    localStorage.getItem('particlesEnabled') !== 'false'
  );

  const toggleParticles = () => {
    const newValue = !particlesEnabled;
    setParticlesEnabled(newValue);
    localStorage.setItem('particlesEnabled', newValue.toString());
  };

  return (
    <BrowserRouter>
        {/* Fondo de partículas (opcional) */}
        <ParticlesBackground enabled={particlesEnabled} />

        <Routes>
          {/* Rutas públicas con Layout */}
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/dependencias" element={<Layout><Dependencias /></Layout>} />
          <Route path="/tramites" element={<Layout><Tramites /></Layout>} />
          <Route path="/carga" element={<Layout><Carga /></Layout>} />
          <Route path="/acerca" element={<Layout><Acerca /></Layout>} />
          
          {/* 404 - Ruta no encontrada */}
          <Route
            path="*"
            element={
              <Layout>
                <div className="text-center py-20">
                  <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
                  <p className="text-2xl mb-4">Página no encontrada</p>
                  <a href="/" className="btn btn-primary">
                    Volver al Dashboard
                  </a>
                </div>
              </Layout>
            }
          />
        </Routes>

        {/* Toggle de partículas (botón flotante) */}
        <button
          onClick={toggleParticles}
          className="fixed bottom-4 right-4 btn btn-circle btn-sm btn-ghost opacity-30 hover:opacity-100 transition-opacity z-50"
          title={particlesEnabled ? 'Desactivar partículas' : 'Activar partículas'}
        >
          {particlesEnabled ? '✨' : '⭐'}
        </button>
      </BrowserRouter>
  );
}

export default App;
