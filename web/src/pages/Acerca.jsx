/**
 * Página Acerca De
 * Panel Secretario - Gobierno de Hidalgo
 */

import { 
  ChartBarIcon, 
  ServerIcon, 
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const Acerca = () => {
  const features = [
    {
      icon: ChartBarIcon,
      title: 'Analítica Ejecutiva',
      description: 'Dashboard interactivo con KPIs, gráficas y métricas en tiempo real para la toma de decisiones.',
    },
    {
      icon: ServerIcon,
      title: 'Arquitectura Escalable',
      description: 'Backend robusto con PostgreSQL + PostGIS, API REST segura y containerización con Docker.',
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Diseño Responsive',
      description: 'Interfaz optimizada para escritorio, tablet y móvil con accesibilidad WCAG AA.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Seguridad',
      description: 'Autenticación por API Key, HTTPS, headers de seguridad y validación de datos.',
    },
  ];

  const techStack = {
    frontend: [
      'React 19.1.0',
      'Vite',
      'React Router DOM v7',
      'TailwindCSS 4.1.7',
      'DaisyUI 5.0',
      'Chart.js + react-chartjs-2',
      'Leaflet + react-leaflet',
    ],
    backend: [
      'Node.js 20 LTS',
      'Express 4.21',
      'PostgreSQL 15',
      'PostGIS 3.3',
      'Multer',
      'csv-parse',
    ],
    infraestructura: [
      'Docker & Docker Compose',
      'Nginx',
      "Let's Encrypt SSL",
      'Rocky Linux',
    ],
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gradient mb-2">
          Acerca del Panel de Simplificación
        </h1>
        <p className="text-lg opacity-70 max-w-3xl mx-auto">
          Plataforma institucional de analítica ejecutiva para el seguimiento del proceso de 
          simplificación de trámites estatales del Gobierno del Estado de Hidalgo
        </p>
      </div>

      {/* Misión */}
      <div className="card-executive bg-gradient-to-br from-primary/10 to-secondary/10">
        <h2 className="text-2xl font-bold mb-4">Nuestra Misión</h2>
        <p className="text-lg leading-relaxed">
          Proporcionar al Secretario y al Gobernador una herramienta ejecutiva que permita 
          visualizar de manera clara y precisa los avances en la simplificación y digitalización 
          de trámites estatales, facilitando la toma de decisiones basada en datos y mejorando 
          la experiencia de los ciudadanos con la administración pública.
        </p>
      </div>

      {/* Características */}
      <div>
        <h2 className="text-3xl font-bold text-center mb-8">Características Principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="card-executive hover:scale-105 transition-transform">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="opacity-70">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stack Tecnológico */}
      <div className="card-executive">
        <h2 className="text-3xl font-bold mb-6 text-center">Stack Tecnológico</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Frontend */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-primary">Frontend</h3>
            <ul className="space-y-2">
              {techStack.frontend.map((tech, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>{tech}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Backend */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-secondary">Backend</h3>
            <ul className="space-y-2">
              {techStack.backend.map((tech, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full"></span>
                  <span>{tech}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Infraestructura */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-accent-gold">Infraestructura</h3>
            <ul className="space-y-2">
              {techStack.infraestructura.map((tech, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent-gold rounded-full"></span>
                  <span>{tech}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Fases de Simplificación */}
      <div className="card-executive">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Fases del Proceso de Simplificación
        </h2>
        <div className="space-y-4">
          {[
            {
              fase: 'Fase 1',
              nombre: 'Trámites Intervenidos',
              descripcion: 'Identificación y análisis inicial de los trámites a simplificar.',
            },
            {
              fase: 'Fase 2',
              nombre: 'Modelado',
              descripcion: 'Mapeo de procesos actuales y diseño de mejoras.',
            },
            {
              fase: 'Fase 3',
              nombre: 'Reingeniería',
              descripcion: 'Rediseño y optimización de procesos administrativos.',
            },
            {
              fase: 'Fase 4',
              nombre: 'Digitalización',
              descripcion: 'Implementación de soluciones tecnológicas y plataformas digitales.',
            },
            {
              fase: 'Fase 5',
              nombre: 'Implementación',
              descripcion: 'Puesta en marcha y capacitación de personal.',
            },
            {
              fase: 'Fase 6',
              nombre: 'Liberación',
              descripcion: 'Trámite completamente simplificado y disponible para ciudadanos.',
            },
          ].map((fase, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 bg-base-200 rounded-xl hover:bg-primary/5 transition-colors"
            >
              <div className="badge badge-primary badge-lg">{fase.fase}</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{fase.nombre}</h3>
                <p className="opacity-70 text-sm">{fase.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Créditos */}
      <div className="card-executive text-center bg-gradient-to-br from-primary to-secondary text-primary-content">
        <h2 className="text-2xl font-bold mb-4">Desarrollado por</h2>
        <p className="text-xl font-bold">
          Comisión Estatal de Mejora Regulatoria (COEMERE)
        </p>
        <p className="text-lg mt-2">
          Gobierno del Estado de Hidalgo
        </p>
        <p className="text-sm mt-4 opacity-90">
          © {new Date().getFullYear()} Todos los derechos reservados
        </p>
        <div className="mt-6">
          <p className="text-sm">Versión 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Acerca;
