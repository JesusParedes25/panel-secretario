/**
 * Cards de Dependencias con Timeline de Fases
 * Panel Secretario - Gobierno de Hidalgo
 */

import { useState } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { getSemaforoColor, getSemaforoEmoji, formatNumber } from '../utils/formatters';

const DependenciasTable = ({ data }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'avance', direction: 'desc' });
  const [selectedDep, setSelectedDep] = useState(null);

  // Preparar datos con cálculo de avance
  const tableData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data.map((dep) => {
      const nivelPromedio = parseFloat(dep.promedio_nivel) || 0;
      
      // Calcular avance basado en fase máxima alcanzada por cada trámite
      const total = dep.total_tramites || 1; // Evitar división por cero
      
      // Las fases son acumulativas: F4 incluye F1, F2, F3, F4
      // Necesitamos saber cuántos trámites tienen cada fase como máximo
      const tramitesEnF1Solo = dep.fases.f1 - dep.fases.f2;
      const tramitesEnF2Solo = dep.fases.f2 - dep.fases.f3;
      const tramitesEnF3Solo = dep.fases.f3 - dep.fases.f4;
      const tramitesEnF4Solo = dep.fases.f4 - dep.fases.f5;
      const tramitesEnF5Solo = dep.fases.f5 - dep.fases.f6;
      const tramitesEnF6Solo = dep.fases.f6;
      
      const sumaNiveles = (
        (tramitesEnF1Solo * 1) +
        (tramitesEnF2Solo * 2) +
        (tramitesEnF3Solo * 3) +
        (tramitesEnF4Solo * 4) +
        (tramitesEnF5Solo * 5) +
        (tramitesEnF6Solo * 6)
      );
      
      const nivelPromedioFase = sumaNiveles / total;
      const avancePorcentaje = (nivelPromedioFase / 6) * 100;
      
      return {
        nombre: dep.dependencia,
        total: dep.total_tramites,
        nivel: nivelPromedio,
        avance: avancePorcentaje,
        fases: dep.fases,
        semaforo: dep.semaforo,
      };
    });
  }, [data]);

  // Ordenar datos
  const sortedData = useMemo(() => {
    const sorted = [...tableData];
    sorted.sort((a, b) => {
      if (sortConfig.key === 'nombre') {
        return sortConfig.direction === 'asc'
          ? a.nombre.localeCompare(b.nombre)
          : b.nombre.localeCompare(a.nombre);
      }
      
      const aVal = a[sortConfig.key] || 0;
      const bVal = b[sortConfig.key] || 0;
      
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [tableData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const getProgressBarColor = (avance) => {
    if (avance >= 66.6) return 'bg-green-500';
    if (avance >= 50) return 'bg-lime-500';
    if (avance >= 33.3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSemaforoIcon = (semaforo) => {
    switch (semaforo) {
      case 'verde':
        return <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>;
      case 'ambar':
        return <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span>;
      default:
        return <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>;
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? (
      <ArrowUpIcon className="w-4 h-4 inline ml-1" />
    ) : (
      <ArrowDownIcon className="w-4 h-4 inline ml-1" />
    );
  };

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Avance por Dependencia</h3>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{sortedData.length}</span> dependencias
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-gray-50 p-3 rounded-lg text-sm">
        <p className="font-semibold mb-2">📊 Cálculo del Avance:</p>
        <p className="text-gray-700">
          <strong>Score = (Nivel Promedio de Fase / 6) × 100</strong>
        </p>
        <p className="text-gray-600 mt-1">
          Cada trámite aporta puntos según su fase máxima alcanzada (F1=1, F2=2, ... F6=6). El promedio se divide entre 6 para obtener un porcentaje.
        </p>
        <p className="text-gray-500 text-xs mt-1">
          Ejemplo: 5 trámites en F4, 1 en F2, 2 en F1 → Score = [(5×4 + 1×2 + 2×1) / 8 / 6] × 100 = 50%
        </p>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('nombre')}
                  className="flex items-center hover:text-primary transition-colors"
                >
                  Dependencia
                  <SortIcon columnKey="nombre" />
                </button>
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('total')}
                  className="flex items-center justify-center w-full hover:text-primary transition-colors"
                >
                  Trámites
                  <SortIcon columnKey="total" />
                </button>
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('nivel')}
                  className="flex items-center justify-center w-full hover:text-primary transition-colors"
                >
                  Nivel
                  <SortIcon columnKey="nivel" />
                </button>
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('avance')}
                  className="flex items-center justify-center w-full hover:text-primary transition-colors"
                >
                  Avance
                  <SortIcon columnKey="avance" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Progreso
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.map((dep, index) => (
              <tr
                key={dep.nombre}
                onClick={() => setSelectedDep(dep)}
                className="hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getSemaforoIcon(dep.semaforo)}
                    <span className="text-sm font-medium text-gray-900">
                      {dep.nombre}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-gray-900">
                    {dep.total}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span className="font-medium">{dep.nivel.toFixed(1)}</span>
                      <span className="opacity-60">4.3</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          dep.nivel >= 3.5 ? 'bg-green-500' :
                          dep.nivel >= 2.5 ? 'bg-lime-500' :
                          dep.nivel >= 1.5 ? 'bg-yellow-500' :
                          dep.nivel >= 0.5 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((dep.nivel / 4.3) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      dep.avance >= 66.6
                        ? 'bg-green-100 text-green-800'
                        : dep.avance >= 50
                        ? 'bg-lime-100 text-lime-800'
                        : dep.avance >= 33.3
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {dep.avance.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    {/* Barra de progreso */}
                    <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full ${getProgressBarColor(dep.avance)} transition-all duration-500`}
                        style={{ width: `${Math.min(dep.avance, 100)}%` }}
                      ></div>
                    </div>
                    {/* Badges de fases */}
                    <div className="flex flex-wrap gap-1">
                      {dep.fases.f1 > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          F1: {dep.fases.f1}
                        </span>
                      )}
                      {dep.fases.f2 > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                          F2: {dep.fases.f2}
                        </span>
                      )}
                      {dep.fases.f3 > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          F3: {dep.fases.f3}
                        </span>
                      )}
                      {dep.fases.f4 > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-lime-100 text-lime-800">
                          F4: {dep.fases.f4}
                        </span>
                      )}
                      {dep.fases.f5 > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          F5: {dep.fases.f5}
                        </span>
                      )}
                      {dep.fases.f6 > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                          F6: {dep.fases.f6}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leyenda de colores */}
      <div className="flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>≥66.6% (Alto)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-lime-500"></div>
          <span>50-66.6% (Bueno)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>33.3-50% (Medio)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>&lt;33.3% (Bajo)</span>
        </div>
      </div>

      {/* Modal de Detalle */}
      {selectedDep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDep(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-secondary text-white p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{selectedDep.nombre}</h2>
                  <p className="text-sm opacity-90">Detalle del avance por fases</p>
                </div>
                <button
                  onClick={() => setSelectedDep(null)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">{selectedDep.total}</div>
                  <div className="text-sm text-gray-600 mt-1">Total Trámites</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-center mb-3">
                    <div className="text-3xl font-bold text-purple-600">{selectedDep.nivel.toFixed(1)}</div>
                    <div className="text-sm text-gray-600 mt-1">Nivel Promedio de Digitalización</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>0</span>
                      <span>4.3</span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          selectedDep.nivel >= 3.5 ? 'bg-green-500' :
                          selectedDep.nivel >= 2.5 ? 'bg-lime-500' :
                          selectedDep.nivel >= 1.5 ? 'bg-yellow-500' :
                          selectedDep.nivel >= 0.5 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((selectedDep.nivel / 4.3) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className={`p-4 rounded-lg text-center ${
                  selectedDep.avance >= 66.6 ? 'bg-green-50' :
                  selectedDep.avance >= 50 ? 'bg-lime-50' :
                  selectedDep.avance >= 33.3 ? 'bg-yellow-50' : 'bg-red-50'
                }`}>
                  <div className={`text-3xl font-bold ${
                    selectedDep.avance >= 66.6 ? 'text-green-600' :
                    selectedDep.avance >= 50 ? 'text-lime-600' :
                    selectedDep.avance >= 33.3 ? 'text-yellow-600' : 'text-red-600'
                  }`}>{selectedDep.avance.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600 mt-1">Score de Avance por Fases</div>
                </div>
              </div>

              {/* Gráfico de Dona + Detalle de Fases */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gráfico de Dona */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-bold mb-4 text-center">Distribución por Fases</h3>
                  <div className="max-w-xs mx-auto">
                    <Doughnut
                      data={{
                        labels: ['F1 - Intervenidos', 'F2 - Modelado', 'F3 - Reingeniería', 'F4 - Digitalización', 'F5 - Implementación', 'F6 - Liberación'],
                        datasets: [{
                          data: [
                            selectedDep.fases.f1,
                            selectedDep.fases.f2,
                            selectedDep.fases.f3,
                            selectedDep.fases.f4,
                            selectedDep.fases.f5,
                            selectedDep.fases.f6,
                          ],
                          backgroundColor: [
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(251, 146, 60, 0.8)',
                            'rgba(251, 191, 36, 0.8)',
                            'rgba(132, 204, 22, 0.8)',
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(22, 163, 74, 0.8)',
                          ],
                          borderColor: [
                            'rgba(239, 68, 68, 1)',
                            'rgba(251, 146, 60, 1)',
                            'rgba(251, 191, 36, 1)',
                            'rgba(132, 204, 22, 1)',
                            'rgba(34, 197, 94, 1)',
                            'rgba(22, 163, 74, 1)',
                          ],
                          borderWidth: 2,
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              padding: 10,
                              font: {
                                size: 11,
                              },
                            },
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                {/* Detalle de Fases */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold mb-4">Detalle por Fase</h3>
                  {[
                    { fase: 'F1', nombre: 'Trámites Intervenidos', valor: selectedDep.fases.f1, color: 'red' },
                    { fase: 'F2', nombre: 'Modelado', valor: selectedDep.fases.f2, color: 'orange' },
                    { fase: 'F3', nombre: 'Reingeniería', valor: selectedDep.fases.f3, color: 'yellow' },
                    { fase: 'F4', nombre: 'Digitalización', valor: selectedDep.fases.f4, color: 'lime' },
                    { fase: 'F5', nombre: 'Implementación', valor: selectedDep.fases.f5, color: 'green' },
                    { fase: 'F6', nombre: 'Liberación', valor: selectedDep.fases.f6, color: 'emerald' },
                  ].map((item) => (
                    <div key={item.fase} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-${item.color}-100 text-${item.color}-800 font-bold text-sm`}>
                          {item.fase}
                        </span>
                        <div>
                          <div className="font-semibold text-gray-900">{item.nombre}</div>
                          <div className="text-xs text-gray-500">
                            {item.valor > 0 ? `${((item.valor / selectedDep.total) * 100).toFixed(1)}% del total` : 'Sin trámites'}
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{item.valor}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de Cerrar */}
              <div className="flex justify-center pt-4 border-t">
                <button
                  onClick={() => setSelectedDep(null)}
                  className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
                >
                  Volver al Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DependenciasTable;
