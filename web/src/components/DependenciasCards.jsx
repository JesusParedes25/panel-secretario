/**
 * Cards de Dependencias con Timeline de Fases
 * Panel Secretario - Gobierno de Hidalgo
 */

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const DependenciasCards = ({ data }) => {
  const [selectedDep, setSelectedDep] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  // Función para obtener color del semáforo
  const getSemaforoColor = (semaforo) => {
    switch (semaforo) {
      case 'verde':
        return 'badge-success';
      case 'ambar':
        return 'badge-warning';
      default:
        return 'badge-error';
    }
  };

  const getSemaforoEmoji = (semaforo) => {
    switch (semaforo) {
      case 'verde':
        return '🟢';
      case 'ambar':
        return '🟡';
      default:
        return '🔴';
    }
  };

  // Ordenar por semáforo (verde > amarillo > rojo) y luego por total de trámites
  const sortedData = [...data].sort((a, b) => {
    const semaforoOrder = { verde: 3, ambar: 2, rojo: 1 };
    const semaforoA = semaforoOrder[a.semaforo] || 0;
    const semaforoB = semaforoOrder[b.semaforo] || 0;
    
    if (semaforoB !== semaforoA) {
      return semaforoB - semaforoA;
    }
    
    return b.total_tramites - a.total_tramites;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Avance por Dependencia</h3>
          <p className="text-sm text-gray-600 mt-1">
            Haz clic en una tarjeta para ver el detalle del flujo de fases
          </p>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{sortedData.length}</span> dependencias
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedData.map((dep) => (
          <div
            key={dep.dependencia_id}
            onClick={() => setSelectedDep(dep)}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-300 overflow-hidden"
          >
            {/* Header con semáforo */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b">
              <div className="flex items-start justify-between mb-2">
                <div className={`badge badge-lg ${getSemaforoColor(dep.semaforo)}`}>
                  {getSemaforoEmoji(dep.semaforo)} {dep.semaforo.toUpperCase()}
                </div>
                <div className="text-3xl font-bold text-blue-600 opacity-30">
                  {dep.total_tramites}
                </div>
              </div>
              <h4 className="font-bold text-gray-800 line-clamp-2 min-h-[3rem]">
                {dep.dependencia}
              </h4>
            </div>

            {/* Contenido */}
            <div className="p-4 space-y-3">
              {/* Total de trámites */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Trámites</span>
                <span className="text-xl font-bold text-gray-900">{dep.total_tramites}</span>
              </div>

              {/* Nivel promedio con barra */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">Nivel de Digitalización</span>
                  <span className="font-semibold text-gray-800">{parseFloat(dep.promedio_nivel).toFixed(1)}/4.3</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      dep.promedio_nivel >= 3.5 ? 'bg-green-500' :
                      dep.promedio_nivel >= 2.5 ? 'bg-lime-500' :
                      dep.promedio_nivel >= 1.5 ? 'bg-yellow-500' :
                      dep.promedio_nivel >= 0.5 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((parseFloat(dep.promedio_nivel) / 4.3) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Fases con badges */}
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-600 mb-2 font-medium">Distribución de Fases</div>
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
            </div>

            {/* Footer con indicador de click */}
            <div className="bg-gray-50 px-4 py-2 text-center">
              <span className="text-xs text-gray-500">Clic para ver detalle →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal con Timeline */}
      {selectedDep && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDep(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 sticky top-0 z-10 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`badge badge-lg ${getSemaforoColor(selectedDep.semaforo)}`}>
                      {getSemaforoEmoji(selectedDep.semaforo)} {selectedDep.semaforo.toUpperCase()}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-1">{selectedDep.dependencia}</h2>
                  <p className="text-sm opacity-90">Flujo de simplificación de trámites</p>
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
            <div className="p-8 space-y-8">
              {/* KPIs Resumen */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                  <div className="text-4xl font-bold text-blue-600">{selectedDep.total_tramites}</div>
                  <div className="text-sm text-gray-600 mt-1">Total de Trámites</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <div className="text-center mb-2">
                    <div className="text-3xl font-bold text-purple-600">
                      {parseFloat(selectedDep.promedio_nivel).toFixed(1)}/4.3
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Nivel de Digitalización Promedio</div>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div
                      className={`h-full transition-all rounded-full ${
                        selectedDep.promedio_nivel >= 3.5 ? 'bg-green-500' :
                        selectedDep.promedio_nivel >= 2.5 ? 'bg-lime-500' :
                        selectedDep.promedio_nivel >= 1.5 ? 'bg-yellow-500' :
                        selectedDep.promedio_nivel >= 0.5 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((parseFloat(selectedDep.promedio_nivel) / 4.3) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Timeline de Fases */}
              <div>
                <h3 className="text-xl font-bold mb-6 text-center">Flujo de Fases (Secuencial)</h3>
                <div className="space-y-4">
                  {[
                    { fase: 'F1', nombre: 'Trámites Intervenidos', count: selectedDep.fases.f1, color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-500', textColor: 'text-red-700' },
                    { fase: 'F2', nombre: 'Modelado', count: selectedDep.fases.f2, color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-500', textColor: 'text-orange-700' },
                    { fase: 'F3', nombre: 'Reingeniería', count: selectedDep.fases.f3, color: 'yellow', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-500', textColor: 'text-yellow-700' },
                    { fase: 'F4', nombre: 'Digitalización', count: selectedDep.fases.f4, color: 'lime', bgColor: 'bg-lime-50', borderColor: 'border-lime-500', textColor: 'text-lime-700' },
                    { fase: 'F5', nombre: 'Implementación', count: selectedDep.fases.f5, color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-500', textColor: 'text-green-700' },
                    { fase: 'F6', nombre: 'Liberación', count: selectedDep.fases.f6, color: 'emerald', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-500', textColor: 'text-emerald-700' },
                  ].map((item, index) => {
                    const percentage = selectedDep.total_tramites > 0 
                      ? ((item.count / selectedDep.total_tramites) * 100).toFixed(1) 
                      : 0;
                    const hasData = item.count > 0;

                    return (
                      <div key={item.fase} className="relative">
                        {/* Línea conectora */}
                        {index < 5 && (
                          <div className="absolute left-12 top-20 w-0.5 h-8 bg-gray-300"></div>
                        )}

                        {/* Card de fase */}
                        <div className={`flex items-center gap-4 p-4 rounded-xl ${item.bgColor} border-2 ${hasData ? item.borderColor : 'border-gray-200'} transition-all ${hasData ? 'shadow-md' : 'opacity-50'}`}>
                          {/* Círculo de fase */}
                          <div className={`flex-shrink-0 w-16 h-16 rounded-full ${hasData ? item.borderColor.replace('border-', 'bg-') : 'bg-gray-300'} flex items-center justify-center`}>
                            <span className="text-white font-bold text-lg">{item.fase}</span>
                          </div>

                          {/* Información */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-gray-900">{item.nombre}</h4>
                                <p className="text-sm text-gray-600 mt-0.5">
                                  {hasData ? `${item.count} trámite${item.count !== 1 ? 's' : ''} (${percentage}%)` : 'Sin trámites en esta fase'}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-3xl font-bold text-gray-900">{item.count}</div>
                              </div>
                            </div>

                            {/* Barra de progreso */}
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className={`h-full ${hasData ? item.borderColor.replace('border-', 'bg-') : 'bg-gray-300'} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nota explicativa */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-gray-700">
                  <strong>Nota:</strong> Las fases son secuenciales. Un trámite debe completar una fase antes de pasar a la siguiente. 
                  Los números mostrados indican cuántos trámites han alcanzado <strong>al menos</strong> esa fase.
                </p>
              </div>

              {/* Botón de cerrar */}
              <div className="flex justify-center pt-4 border-t">
                <button
                  onClick={() => setSelectedDep(null)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
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

export default DependenciasCards;
