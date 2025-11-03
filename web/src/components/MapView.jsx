/**
 * Mapa Interactivo con Leaflet
 * Panel Secretario - Gobierno de Hidalgo
 */

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiService from '../services/api';

// Fix para iconos de Leaflet en Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapView = () => {
  const [tramitesGeo, setTramitesGeo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Centro de Pachuca, Hidalgo
  const center = [20.0911, -98.7624];

  useEffect(() => {
    loadTramitesGeo();
  }, []);

  const loadTramitesGeo = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTramitesGeo();
      setTramitesGeo(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando trámites geo:', err);
      setError('Error cargando datos geográficos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-executive flex items-center justify-center h-[400px]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-executive">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (tramitesGeo.length === 0) {
    return (
      <div className="card-executive flex flex-col items-center justify-center h-[400px] text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-xl font-bold mb-2">Sin Georreferencias Disponibles</h3>
        <p className="text-sm opacity-70">
          Aún no hay trámites con coordenadas geográficas registradas
        </p>
      </div>
    );
  }

  return (
    <div className="card-executive">
      <h3 className="text-xl font-bold mb-4">Trámites Georreferenciados</h3>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '400px', borderRadius: '1rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {tramitesGeo.map((tramite, index) => (
          <Marker key={index} position={[tramite.lat, tramite.lng]}>
            <Popup>
              <div className="p-2">
                <h4 className="font-bold text-sm mb-1">{tramite.tramite}</h4>
                <p className="text-xs opacity-70 mb-2">{tramite.dependencia}</p>
                <div className="badge badge-sm">
                  Nivel de digitalización: {tramite.nivel_digitalizacion}
                </div>
                {tramite.liberado && (
                  <div className="badge badge-success badge-sm ml-1">
                    Liberado
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="mt-2 text-xs opacity-70 text-center">
        {tramitesGeo.length} trámite{tramitesGeo.length !== 1 ? 's' : ''} georreferenciado{tramitesGeo.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default MapView;
