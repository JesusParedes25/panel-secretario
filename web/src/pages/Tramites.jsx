/**
 * Página de Trámites
 * Panel Secretario - Gobierno de Hidalgo
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import apiService from '../services/api';
import { formatDateTime, downloadBlob } from '../utils/formatters';

const Tramites = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tramites, setTramites] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    dependencia: searchParams.get('dependencia') || '',
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
  });

  useEffect(() => {
    loadTramites();
  }, [filters]);

  const loadTramites = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTramites(filters);
      setTramites(response.data.data || []);
      setPagination(response.data.pagination);
      setError(null);

      // Actualizar URL con filtros
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.dependencia) params.set('dependencia', filters.dependencia);
      params.set('page', filters.page.toString());
      params.set('limit', filters.limit.toString());
      setSearchParams(params);
    } catch (err) {
      console.error('Error cargando trámites:', err);
      setError('Error cargando datos de trámites');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset page when changing filters
    }));
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await apiService.exportCSV();
      downloadBlob(response.data, `panel_secretario_export_${Date.now()}.csv`);
    } catch (err) {
      console.error('Error exportando CSV:', err);
      alert('Error al exportar datos');
    } finally {
      setExporting(false);
    }
  };

  const renderPagination = () => {
    if (!pagination) return null;

    const pages = [];
    const maxPages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxPages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex justify-center mt-6">
        <div className="join">
          <button
            className="join-item btn btn-sm"
            onClick={() => handleFilterChange('page', pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            «
          </button>
          {pages.map((page) => (
            <button
              key={page}
              className={`join-item btn btn-sm ${
                page === pagination.page ? 'btn-active' : ''
              }`}
              onClick={() => handleFilterChange('page', page)}
            >
              {page}
            </button>
          ))}
          <button
            className="join-item btn btn-sm"
            onClick={() => handleFilterChange('page', pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            »
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">
            Buscador de Trámites
          </h1>
          <p className="text-lg opacity-70">
            Explorar y filtrar trámites en proceso de simplificación
          </p>
        </div>
        <button
          className="btn btn-primary gap-2"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <ArrowDownTrayIcon className="h-5 w-5" />
          )}
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="card-executive">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda por texto */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Buscar por nombre</span>
            </label>
            <div className="input-group">
              <input
                type="text"
                placeholder="Nombre del trámite..."
                className="input input-bordered w-full"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <button className="btn btn-square btn-primary">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filtro por dependencia */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Dependencia</span>
            </label>
            <input
              type="text"
              placeholder="Nombre de la dependencia..."
              className="input input-bordered"
              value={filters.dependencia}
              onChange={(e) => handleFilterChange('dependencia', e.target.value)}
            />
          </div>

          {/* Resultados por página */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Resultados por página</span>
            </label>
            <select
              className="select select-bordered"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {pagination && (
          <div className="mt-4 text-sm opacity-70">
            Mostrando {tramites.length} de {pagination.total} trámites totales
          </div>
        )}
      </div>

      {/* Tabla de Trámites */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="mt-4 text-lg">Cargando trámites...</p>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-error shadow-lg">
          <span>{error}</span>
          <button className="btn btn-sm" onClick={loadTramites}>
            Reintentar
          </button>
        </div>
      ) : tramites.length === 0 ? (
        <div className="card-executive text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold mb-2">No se encontraron trámites</h3>
          <p className="opacity-70">Intenta modificar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="card-executive">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead className="bg-primary text-primary-content">
                <tr>
                  <th>Trámite</th>
                  <th>Dependencia</th>
                  <th className="text-center">Nivel</th>
                  <th className="text-center">Fases</th>
                  <th>Última Actualización</th>
                </tr>
              </thead>
              <tbody>
                {tramites.map((tramite) => {
                  const fases = [
                    tramite.fase1_tramites_intervenidos,
                    tramite.fase2_modelado,
                    tramite.fase3_reingenieria,
                    tramite.fase4_digitalizacion,
                    tramite.fase5_implementacion,
                    tramite.fase6_liberacion,
                  ];

                  return (
                    <tr key={tramite.id} className="hover">
                      <td className="font-medium max-w-md">
                        <div className="line-clamp-2">{tramite.tramite}</div>
                      </td>
                      <td className="text-sm opacity-70">
                        <div className="line-clamp-2">{tramite.dependencia}</div>
                      </td>
                      <td className="text-center">
                        <div className="badge badge-primary badge-lg font-bold">
                          {tramite.nivel_digitalizacion}
                        </div>
                      </td>
                      <td>
                        <div className="flex justify-center gap-1">
                          {fases.map((completada, index) => (
                            <div
                              key={index}
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                completada
                                  ? 'bg-success text-success-content scale-110'
                                  : 'bg-base-300 text-base-content opacity-30'
                              }`}
                              title={`Fase ${index + 1}`}
                            >
                              {index + 1}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="text-sm opacity-70">
                        {formatDateTime(tramite.updated_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {renderPagination()}
        </div>
      )}
    </div>
  );
};

export default Tramites;
