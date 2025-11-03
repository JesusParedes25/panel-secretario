/**
 * Página de Dependencias
 * Panel Secretario - Gobierno de Hidalgo
 */

import { useEffect, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import apiService from '../services/api';
import { formatNumber, getSemaforoColor, getSemaforoEmoji, fasesToArray } from '../utils/formatters';

const Dependencias = () => {
  const [dependencias, setDependencias] = useState([]);
  const [filteredDependencias, setFilteredDependencias] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'total_tramites', direction: 'desc' });

  useEffect(() => {
    loadDependencias();
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [searchTerm, dependencias, sortConfig]);

  const loadDependencias = async () => {
    try {
      setLoading(true);
      const response = await apiService.getResumenDependencias();
      setDependencias(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando dependencias:', err);
      setError('Error cargando datos de dependencias');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSort = () => {
    let result = [...dependencias];

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      result = result.filter((dep) =>
        dep.dependencia.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredDependencias(result);
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-lg">Cargando dependencias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg">
        <span>{error}</span>
        <button className="btn btn-sm" onClick={loadDependencias}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">
          Explorador de Dependencias
        </h1>
        <p className="text-lg opacity-70">
          Ranking y métricas por institución gubernamental
        </p>
      </div>

      {/* Buscador */}
      <div className="card-executive">
        <div className="form-control">
          <div className="input-group">
            <input
              type="text"
              placeholder="Buscar dependencia..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-square btn-primary">
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="mt-2 text-sm opacity-70">
          Mostrando {filteredDependencias.length} de {dependencias.length} dependencias
        </div>
      </div>

      {/* Resumen de Ranking */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredDependencias.slice(0, 3).map((dep, index) => (
          <div key={dep.dependencia_id} className="card-executive border-2 border-primary">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl font-bold text-primary opacity-20">
                #{index + 1}
              </div>
              <div className={`badge badge-lg ${getSemaforoColor(dep.semaforo)}`}>
                {getSemaforoEmoji(dep.semaforo)} {dep.semaforo.toUpperCase()}
              </div>
            </div>
            <h3 className="text-lg font-bold mb-3 line-clamp-2">
              {dep.dependencia}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm opacity-70">Trámites:</span>
                <span className="font-bold">{formatNumber(dep.total_tramites)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm opacity-70">Nivel de digitalización:</span>
                <span className="font-bold text-primary">{dep.promedio_nivel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm opacity-70">Digitalizados:</span>
                <span className="font-bold text-success">{formatNumber(dep.fases.f4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm opacity-70">Liberados:</span>
                <span className="font-bold text-accent-gold">{formatNumber(dep.fases.f6)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla Completa */}
      <div className="card-executive">
        <h2 className="text-2xl font-bold mb-4">Todas las Dependencias</h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead className="bg-primary text-primary-content">
              <tr>
                <th className="cursor-pointer" onClick={() => handleSort('dependencia')}>
                  Dependencia {sortConfig.key === 'dependencia' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-center cursor-pointer" onClick={() => handleSort('total_tramites')}>
                  Trámites {sortConfig.key === 'total_tramites' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-center cursor-pointer" onClick={() => handleSort('promedio_nivel')}>
                  Nivel Digit. {sortConfig.key === 'promedio_nivel' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-center">F1</th>
                <th className="text-center">F2</th>
                <th className="text-center">F3</th>
                <th className="text-center">F4</th>
                <th className="text-center">F5</th>
                <th className="text-center">F6</th>
                <th className="text-center cursor-pointer" onClick={() => handleSort('semaforo')}>
                  Estado {sortConfig.key === 'semaforo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDependencias.map((dep) => (
                <tr key={dep.dependencia_id} className="hover">
                  <td className="font-medium">{dep.dependencia}</td>
                  <td className="text-center font-bold">{formatNumber(dep.total_tramites)}</td>
                  <td className="text-center">
                    <div className="badge badge-primary">{dep.promedio_nivel}</div>
                  </td>
                  <td className="text-center">
                    <span className="text-sm">{dep.fases.f1}</span>
                    <div className="text-xs opacity-60">{dep.porcentajes.f1}%</div>
                  </td>
                  <td className="text-center">
                    <span className="text-sm">{dep.fases.f2}</span>
                    <div className="text-xs opacity-60">{dep.porcentajes.f2}%</div>
                  </td>
                  <td className="text-center">
                    <span className="text-sm">{dep.fases.f3}</span>
                    <div className="text-xs opacity-60">{dep.porcentajes.f3}%</div>
                  </td>
                  <td className="text-center">
                    <span className="text-sm">{dep.fases.f4}</span>
                    <div className="text-xs opacity-60">{dep.porcentajes.f4}%</div>
                  </td>
                  <td className="text-center">
                    <span className="text-sm">{dep.fases.f5}</span>
                    <div className="text-xs opacity-60">{dep.porcentajes.f5}%</div>
                  </td>
                  <td className="text-center">
                    <span className="text-sm font-bold">{dep.fases.f6}</span>
                    <div className="text-xs opacity-60">{dep.porcentajes.f6}%</div>
                  </td>
                  <td className="text-center">
                    <div className={`badge ${getSemaforoColor(dep.semaforo)}`}>
                      {getSemaforoEmoji(dep.semaforo)} {dep.semaforo}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dependencias;
