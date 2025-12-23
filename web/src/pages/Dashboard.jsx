/**
 * Dashboard Ejecutivo
 * Panel Secretario - Gobierno de Hidalgo
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  ChartBarIcon, 
  BuildingOffice2Icon, 
  DocumentTextIcon,
  ComputerDesktopIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import apiService from '../services/api';
import KPICard from '../components/KPICard';
import { formatNumber } from '../utils/formatters';

const Dashboard = () => {
  const [resumenGlobal, setResumenGlobal] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [dependencias, setDependencias] = useState(null);
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDep, setSelectedDep] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tramiteSearchTerm, setTramiteSearchTerm] = useState('');
  const [tramiteSortConfig, setTramiteSortConfig] = useState({ key: 'fase_maxima', direction: 'desc' });
  const [selectedFase, setSelectedFase] = useState(null);
  const [tramitesPorFase, setTramitesPorFase] = useState([]);
  const [selectedGlobalEtapa, setSelectedGlobalEtapa] = useState(null);
  const [tramitesPorEtapaGlobal, setTramitesPorEtapaGlobal] = useState([]);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalSortConfig, setModalSortConfig] = useState({ key: 'tramite', direction: 'asc' });
  const [depSortAsc, setDepSortAsc] = useState(false); // false = mejor primero (desc)
  
  // Estado para filtro de año
  const [selectedAnio, setSelectedAnio] = useState('all');
  const [aniosDisponibles, setAniosDisponibles] = useState([]);

  // Calcular score de calidad sin sesgo por cantidad
  const calculateQualityScore = useCallback((dep) => {
    const total = dep.total_tramites || 1;
    
    // Calcular cuántos trámites están en cada fase como máximo alcanzado
    const tramitesEnF1Solo = dep.fases.f1 - dep.fases.f2;
    const tramitesEnF2Solo = dep.fases.f2 - dep.fases.f3;
    const tramitesEnF3Solo = dep.fases.f3 - dep.fases.f4;
    const tramitesEnF4Solo = dep.fases.f4 - dep.fases.f5;
    const tramitesEnF5Solo = dep.fases.f5 - dep.fases.f6;
    const tramitesEnF6Solo = dep.fases.f6;
    
    // Suma ponderada
    const sumaPonderada = (
      (tramitesEnF1Solo * 1) +
      (tramitesEnF2Solo * 2) +
      (tramitesEnF3Solo * 3) +
      (tramitesEnF4Solo * 4) +
      (tramitesEnF5Solo * 5) +
      (tramitesEnF6Solo * 6)
    );
    
    // Score normalizado (0-100)
    return (sumaPonderada / total / 6) * 100;
  }, []);

  // Filtrar y ordenar dependencias
  const filteredAndSortedDeps = useMemo(() => {
    if (!dependencias) return [];
    
    // Filtrar por búsqueda
    let filtered = dependencias.filter(dep =>
      dep.dependencia.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Ordenar por semáforo (verde > ambar > rojo) y luego por score
    const semaforoOrder = { verde: 0, ambar: 1, rojo: 2 };
    filtered.sort((a, b) => {
      const orderA = semaforoOrder[a.semaforo] ?? 3;
      const orderB = semaforoOrder[b.semaforo] ?? 3;
      
      // Primero por semáforo
      if (orderA !== orderB) {
        return depSortAsc ? orderB - orderA : orderA - orderB;
      }
      
      // Dentro del mismo semáforo, por score de calidad
      const scoreA = calculateQualityScore(a);
      const scoreB = calculateQualityScore(b);
      return depSortAsc ? scoreA - scoreB : scoreB - scoreA;
    });
    
    return filtered;
  }, [dependencias, searchTerm, calculateQualityScore, depSortAsc]);

  // Filtrar y ordenar trámites
  const filteredAndSortedTramites = useMemo(() => {
    if (!kpis?.topTramites) return [];
    
    // Filtrar por búsqueda
    let filtered = kpis.topTramites.filter(tramite =>
      tramite.tramite.toLowerCase().includes(tramiteSearchTerm.toLowerCase()) ||
      tramite.dependencia.toLowerCase().includes(tramiteSearchTerm.toLowerCase())
    );
    
    // Calcular fase máxima y semáforo para cada trámite
    filtered = filtered.map(t => {
      const faseMax = t.fase6_liberacion ? 6 :
                      t.fase5_implementacion ? 5 :
                      t.fase4_digitalizacion ? 4 :
                      t.fase3_reingenieria ? 3 :
                      t.fase2_modelado ? 2 :
                      t.fase1_tramites_intervenidos ? 1 : 0;
      const totalAcciones = (parseInt(t.s) || 0) + (parseInt(t.r) || 0);
      
      // Semáforo: Verde (E5-E6 o E3-E4 con acciones), Ambar (E3-E4 o con acciones), Rojo (resto)
      let semaforo = 'rojo';
      if (faseMax >= 5 || (faseMax >= 3 && totalAcciones > 0)) {
        semaforo = 'verde';
      } else if (faseMax >= 3 || totalAcciones > 0) {
        semaforo = 'ambar';
      }
      
      return { ...t, fase_maxima: faseMax, total_acciones: totalAcciones, semaforo };
    });
    
    // Ordenar por el criterio seleccionado
    const semaforoOrder = { verde: 0, ambar: 1, rojo: 2 };
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      // Manejo especial para semáforo (ordenar como verde > ambar > rojo)
      if (tramiteSortConfig.key === 'semaforo') {
        aVal = semaforoOrder[a.semaforo] ?? 3;
        bVal = semaforoOrder[b.semaforo] ?? 3;
      } else {
        aVal = a[tramiteSortConfig.key];
        bVal = b[tramiteSortConfig.key];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal?.toLowerCase() || '';
        }
      }
      
      if (tramiteSortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
    
    return filtered;
  }, [kpis, tramiteSearchTerm, tramiteSortConfig]);

  const handleTramiteSort = (key) => {
    setTramiteSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleFaseClick = async (faseNum, dependenciaNombre) => {
    try {
      setSelectedFase(faseNum);
      const response = await apiService.getTramites({ dependencia: dependenciaNombre, fase: faseNum });
      const tramites = response.data?.data || response.data || [];
      console.log(`Etapa ${faseNum} - ${dependenciaNombre}:`, tramites.length, 'trámites');
      setTramitesPorFase(tramites);
    } catch (error) {
      console.error('Error cargando trámites por etapa:', error);
      setTramitesPorFase([]);
    }
  };

  const handleGlobalEtapaClick = async (etapaNum, etapaNombre) => {
    try {
      setSelectedGlobalEtapa({ num: etapaNum, nombre: etapaNombre });
      setModalSearchTerm('');
      setModalSortConfig({ key: 'tramite', direction: 'asc' });
      // Traer TODOS los trámites (limit alto para evitar paginación)
      const response = await apiService.getTramites({ fase: etapaNum, limit: 10000 });
      const tramites = response.data?.data || response.data || [];
      console.log(`Etapa ${etapaNum} global:`, tramites.length, 'trámites');
      setTramitesPorEtapaGlobal(tramites);
    } catch (error) {
      console.error('Error cargando trámites por etapa global:', error);
      setTramitesPorEtapaGlobal([]);
    }
  };

  const handleModalSort = (key) => {
    setModalSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Filtrar y ordenar trámites del modal
  const filteredAndSortedModalTramites = useMemo(() => {
    if (!tramitesPorEtapaGlobal) return [];
    
    let filtered = tramitesPorEtapaGlobal.filter(tramite =>
      tramite.tramite.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
      tramite.dependencia.toLowerCase().includes(modalSearchTerm.toLowerCase())
    );
    
    filtered.sort((a, b) => {
      let aVal = a[modalSortConfig.key];
      let bVal = b[modalSortConfig.key];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || '';
      }
      
      if (modalSortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
    
    return filtered;
  }, [tramitesPorEtapaGlobal, modalSearchTerm, modalSortConfig]);

  useEffect(() => {
    loadDashboardData();
  }, [selectedAnio]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const anioParam = selectedAnio === 'all' ? null : selectedAnio;
      
      const [resumenRes, kpisRes, depsRes, goalsRes] = await Promise.all([
        apiService.getResumenGlobal(anioParam),
        apiService.getKPIs(),
        apiService.getResumenDependencias(anioParam),
        apiService.getGoals(anioParam),
      ]);

      setResumenGlobal(resumenRes.data.data);
      setKpis(kpisRes.data.data);
      setDependencias(depsRes.data.data);
      setGoals(goalsRes.data.data);
      
      // Actualizar años disponibles desde la respuesta de goals
      if (goalsRes.data.data?.aniosDisponibles) {
        setAniosDisponibles(goalsRes.data.data.aniosDisponibles);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-lg">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg">
        <span>{error}</span>
        <button className="btn btn-sm" onClick={loadDashboardData}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Institucional */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-gray-50 to-gray-100 shadow-xl border border-gray-200">
        {/* Borde superior con color institucional */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#9f2241] via-[#691C32] to-[#9f2241]"></div>
        
        {/* Patrón decorativo sutil */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#9f2241] rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#ddc9a3] rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative z-10 p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#9f2241] to-[#691C32] bg-clip-text text-transparent mb-6 leading-tight">
              Tablero de Seguimiento del Proceso de Simplificación de Trámites Estatales en Hidalgo
            </h1>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed text-justify">
                Este panel es administrado por la <strong className="text-[#9f2241] font-bold">Comisión Estatal de Mejora Regulatoria (COEMERE)</strong> para dar seguimiento 
                al avance de cada dependencia en el proceso de simplificación de trámites. Este proceso fue establecido por la COEMERE 
                para la <strong className="text-[#9f2241] font-bold">transformación digital del estado</strong>, en coherencia con los lineamientos de la 
                <strong className="text-[#9f2241] font-bold"> Agencia de Transformación Digital y Telecomunicaciones</strong> del gobierno federal.
              </p>
              <p className="text-gray-600 text-sm">
                El objetivo es modernizar y digitalizar los servicios gubernamentales para ofrecer una mejor experiencia 
                a la ciudadanía hidalguense.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Año */}
      {aniosDisponibles.length > 1 && (
        <div className="flex items-center justify-end gap-3 bg-base-100 rounded-lg p-3 shadow-sm border">
          <span className="text-sm font-medium text-gray-600">Ver datos de:</span>
          <select
            className="select select-bordered select-sm w-48"
            value={selectedAnio}
            onChange={(e) => setSelectedAnio(e.target.value)}
          >
            <option value="all">
              {aniosDisponibles.join('-')} (Acumulado)
            </option>
            {aniosDisponibles.map((anio) => (
              <option key={anio} value={anio}>
                Solo {anio}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total de Trámites"
          value={resumenGlobal?.total_tramites || 0}
          icon={DocumentTextIcon}
          subtitle="Trámites en proceso de simplificación"
          color="#9f2241"
          showProgressBar={true}
          maxValue={goals?.goals?.total || 300}
          showPercentOfMax={true}
        />
        <KPICard
          title="Dependencias"
          value={resumenGlobal?.total_dependencias || 0}
          icon={BuildingOffice2Icon}
          subtitle="Secretarías participantes"
          color="#ddc9a3"
        />
        <KPICard
          title="Nivel Promedio de Digitalización"
          value={resumenGlobal?.promedio_nivel_global || 0}
          icon={ComputerDesktopIcon}
          subtitle="De los Trámites en proceso de simplificación"
          color="primary"
          showProgressBar={true}
          maxValue={4}
          progressLabel="Nivel máximo: 4"
        />
        <KPICard
          title="Acciones Implementadas"
          value={resumenGlobal?.total_acciones || 0}
          icon={ChartBarIcon}
          subtitle="Simplificación + Regulación"
          color="#235b4e"
          showProgressBar={true}
          maxValue={goals?.goals?.acciones || 150}
          showPercentOfMax={true}
        />
      </div>

      {/* Progreso por Etapas - Diseño Pipeline */}
      <div className="card-executive overflow-hidden">
        <h2 className="text-2xl font-bold mb-2">Avance por Etapas</h2>
        <p className="text-sm text-gray-600 mb-6">Click en una etapa para ver los trámites. Porcentajes basados en metas {goals?.goals?.label || '2025'}.</p>
        
        {goals?.progress && (
          <div className="relative">
            {/* Línea conectora de fondo */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 transform -translate-y-1/2 hidden lg:block" style={{zIndex: 0}}></div>
            
            <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" style={{zIndex: 1}}>
              {/* E1 */}
              {(() => {
                const etapaData = goals.progress.etapa1;
                const etapaNombre = resumenGlobal?.fases?.[0]?.nombre || 'Trámites Intervenidos';
                return (
                  <button
                    onClick={() => handleGlobalEtapaClick(1, etapaNombre)}
                    className="group bg-white rounded-xl p-4 shadow-sm border-2 border-gray-100 hover:border-primary hover:shadow-lg transition-all"
                    disabled={etapaData?.actual === 0}
                  >
                    <div className="relative w-16 h-16 mx-auto mb-3">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200" />
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - (etapaData?.porcentaje || 0) / 100)}`}
                          className="text-primary transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-base font-bold">{(etapaData?.porcentaje || 0).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-primary">E1</div>
                      <div className="text-xs text-gray-600 mt-1 line-clamp-1">{etapaNombre}</div>
                      <div className="text-sm font-bold text-gray-800 mt-2">{formatNumber(etapaData?.actual || 0)}<span className="text-gray-400 font-normal">/{formatNumber(etapaData?.meta || 0)}</span></div>
                    </div>
                  </button>
                );
              })()}

              {/* E2 */}
              {(() => {
                const etapaData = goals.progress.etapa2;
                const etapaNombre = resumenGlobal?.fases?.[1]?.nombre || 'Modelado';
                return (
                  <button
                    onClick={() => handleGlobalEtapaClick(2, etapaNombre)}
                    className="group bg-white rounded-xl p-4 shadow-sm border-2 border-gray-100 hover:border-primary hover:shadow-lg transition-all"
                    disabled={etapaData?.actual === 0}
                  >
                    <div className="relative w-16 h-16 mx-auto mb-3">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200" />
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - (etapaData?.porcentaje || 0) / 100)}`}
                          className="text-primary transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-base font-bold">{(etapaData?.porcentaje || 0).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-primary">E2</div>
                      <div className="text-xs text-gray-600 mt-1 line-clamp-1">{etapaNombre}</div>
                      <div className="text-sm font-bold text-gray-800 mt-2">{formatNumber(etapaData?.actual || 0)}<span className="text-gray-400 font-normal">/{formatNumber(etapaData?.meta || 0)}</span></div>
                    </div>
                  </button>
                );
              })()}

              {/* E3 y E4 - Tarjeta combinada */}
              <div className="col-span-2 bg-gradient-to-br from-primary/5 via-white to-primary/5 rounded-xl p-4 shadow-sm border-2 border-primary/30">
                <div className="grid grid-cols-2 gap-3">
                  {[3, 4].map((etapaNum) => {
                    const etapaKey = `etapa${etapaNum}`;
                    const etapaData = goals.progress[etapaKey];
                    const etapaNombre = resumenGlobal?.fases?.[etapaNum - 1]?.nombre || `Etapa ${etapaNum}`;
                    return (
                      <button
                        key={etapaKey}
                        onClick={() => handleGlobalEtapaClick(etapaNum, etapaNombre)}
                        className="group bg-white rounded-lg p-3 border border-gray-200 hover:border-primary hover:shadow-md transition-all"
                        disabled={etapaData?.actual === 0}
                      >
                        <div className="relative w-14 h-14 mx-auto mb-2">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-gray-200" />
                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="5" fill="transparent"
                              strokeDasharray={`${2 * Math.PI * 24}`}
                              strokeDashoffset={`${2 * Math.PI * 24 * (1 - (etapaData?.porcentaje || 0) / 100)}`}
                              className="text-primary transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold">{(etapaData?.porcentaje || 0).toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-primary text-sm">E{etapaNum}</div>
                          <div className="text-xs text-gray-600 line-clamp-1">{etapaNombre}</div>
                          <div className="text-sm font-bold text-gray-800 mt-1">{formatNumber(etapaData?.actual || 0)}<span className="text-gray-400 font-normal text-xs">/{formatNumber(etapaData?.meta || 0)}</span></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* E5 */}
              {(() => {
                const etapaData = goals.progress.etapa5;
                const etapaNombre = resumenGlobal?.fases?.[4]?.nombre || 'Implementación';
                return (
                  <button
                    onClick={() => handleGlobalEtapaClick(5, etapaNombre)}
                    className="group bg-white rounded-xl p-4 shadow-sm border-2 border-gray-100 hover:border-primary hover:shadow-lg transition-all"
                    disabled={etapaData?.actual === 0}
                  >
                    <div className="relative w-16 h-16 mx-auto mb-3">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200" />
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - (etapaData?.porcentaje || 0) / 100)}`}
                          className="text-primary transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-base font-bold">{(etapaData?.porcentaje || 0).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-primary">E5</div>
                      <div className="text-xs text-gray-600 mt-1 line-clamp-1">{etapaNombre}</div>
                      <div className="text-sm font-bold text-gray-800 mt-2">{formatNumber(etapaData?.actual || 0)}<span className="text-gray-400 font-normal">/{formatNumber(etapaData?.meta || 0)}</span></div>
                    </div>
                  </button>
                );
              })()}

              {/* E6 */}
              {(() => {
                const etapaData = goals.progress.etapa6;
                const etapaNombre = resumenGlobal?.fases?.[5]?.nombre || 'Liberación';
                return (
                  <button
                    onClick={() => handleGlobalEtapaClick(6, etapaNombre)}
                    className="group bg-white rounded-xl p-4 shadow-sm border-2 border-gray-100 hover:border-primary hover:shadow-lg transition-all"
                    disabled={etapaData?.actual === 0}
                  >
                    <div className="relative w-16 h-16 mx-auto mb-3">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200" />
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - (etapaData?.porcentaje || 0) / 100)}`}
                          className="text-primary transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-base font-bold">{(etapaData?.porcentaje || 0).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-primary">E6</div>
                      <div className="text-xs text-gray-600 mt-1 line-clamp-1">{etapaNombre}</div>
                      <div className="text-sm font-bold text-gray-800 mt-2">{formatNumber(etapaData?.actual || 0)}<span className="text-gray-400 font-normal">/{formatNumber(etapaData?.meta || 0)}</span></div>
                    </div>
                  </button>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Buscador de Dependencias */}
      {dependencias && (
        <div className="card-executive">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar dependencia..."
                  className="input input-bordered w-full pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {searchTerm ? (
                <span>
                  <strong>{filteredAndSortedDeps.length}</strong> resultado(s) de <strong>{dependencias.length}</strong>
                </span>
              ) : (
                <span>
                  <strong>{filteredAndSortedDeps.length}</strong> dependencias
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ranking Top 3 Dependencias */}
      {filteredAndSortedDeps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredAndSortedDeps.slice(0, 3).map((dep, index) => (
            <div key={dep.dependencia_id} className="card-executive border-2 border-primary">
              <div className="flex items-start justify-between mb-4">
                <div className="text-5xl font-bold text-primary opacity-20">
                  #{index + 1}
                </div>
                <div className={`w-4 h-4 rounded-full shadow-md ${
                  dep.semaforo === 'verde' ? 'bg-green-500' :
                  dep.semaforo === 'ambar' ? 'bg-yellow-400' : 'bg-red-500'
                }`} title={dep.semaforo}></div>
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
      )}

      {/* Tabla Completa de Dependencias */}
      <div className="card-executive">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Todas las Dependencias</h2>
          <div className="text-sm text-gray-600">
            Ordenadas por calidad de avance (mayor % en fases avanzadas)
          </div>
        </div>
        
        {filteredAndSortedDeps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchTerm ? `No se encontraron resultados para "${searchTerm}"` : 'No hay dependencias disponibles'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 btn btn-primary btn-sm"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
            <thead className="bg-primary text-primary-content">
              <tr>
                <th>Dependencia</th>
                <th className="text-center">Trámites</th>
                <th className="text-center">Nivel Dig.</th>
                <th className="text-center">E1</th>
                <th className="text-center">E2</th>
                <th className="text-center">E3</th>
                <th className="text-center" title="Acciones de Simplificación + Regulación">Acciones</th>
                <th className="text-center">E4</th>
                <th className="text-center">E5</th>
                <th className="text-center">E6</th>
                <th 
                  className="text-center cursor-pointer hover:bg-[#691C32] select-none"
                  onClick={() => setDepSortAsc(!depSortAsc)}
                  title="Click para invertir orden"
                >
                  Estado {depSortAsc ? '↑' : '↓'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedDeps.map((dep) => (
                <tr 
                  key={dep.dependencia_id} 
                  className="hover cursor-pointer"
                  onClick={() => setSelectedDep(dep)}
                >
                  <td className="font-medium">{dep.dependencia}</td>
                  <td className="text-center font-bold">{formatNumber(dep.total_tramites)}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span className="font-medium">{parseFloat(dep.promedio_nivel).toFixed(1)}</span>
                        <span className="opacity-60">4.3</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            dep.promedio_nivel >= 3.5 ? 'bg-green-500' :
                            dep.promedio_nivel >= 2.5 ? 'bg-lime-500' :
                            dep.promedio_nivel >= 1.5 ? 'bg-yellow-500' :
                            dep.promedio_nivel >= 0.5 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min((parseFloat(dep.promedio_nivel) / 4.3) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="text-sm">{dep.fases.f1}</span>
                    <div className="text-xs opacity-60">{dep.porcentajes?.f1 || 0}%</div>
                  </td>
                  <td className="text-center">
                    <span className="text-sm">{dep.fases.f2}</span>
                    <div className="text-xs opacity-60">{dep.porcentajes?.f2 || 0}%</div>
                  </td>
                  <td className="text-center">
                    <span className="text-sm">{dep.fases.f3}</span>
                    <div className="text-xs opacity-60">{dep.porcentajes?.f3 || 0}%</div>
                  </td>
                  <td className="text-center">
                    <span className="text-sm font-semibold text-primary">{dep.total_acciones || 0}</span>
                  </td>
                  <td className="text-center">
                    <span className="text-sm">{dep.fases.f4}</span>
                    <div className="text-xs opacity-60">{dep.porcentajes?.f4 || 0}%</div>
                  </td>
                  <td className="text-center">
                    <span className="text-sm">{dep.fases.f5}</span>
                    <div className="text-xs opacity-60">{dep.porcentajes?.f5 || 0}%</div>
                  </td>
                  <td className="text-center">
                    <span className="text-sm font-bold">{dep.fases.f6}</span>
                    <div className="text-xs opacity-60">{dep.porcentajes?.f6 || 0}%</div>
                  </td>
                  <td className="text-center">
                    <div className={`w-3 h-3 rounded-full ${
                      dep.semaforo === 'verde' ? 'bg-green-500' :
                      dep.semaforo === 'ambar' ? 'bg-yellow-400' : 'bg-red-500'
                    }`} title={dep.semaforo}></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Todos los Trámites */}
      <div className="card-executive">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">
              Todos los Trámites
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Filtrar y ordenar por avance, nombre o dependencia
            </p>
          </div>
          <div className="text-sm text-gray-600">
            {filteredAndSortedTramites.length} de {kpis?.topTramites?.length || 0} trámite(s)
          </div>
        </div>

        {/* Buscador de Trámites */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar trámite o dependencia..."
              className="input input-bordered w-full pr-10"
              value={tramiteSearchTerm}
              onChange={(e) => setTramiteSearchTerm(e.target.value)}
            />
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {filteredAndSortedTramites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {tramiteSearchTerm ? `No se encontraron resultados para "${tramiteSearchTerm}"` : 'No hay trámites disponibles'}
            </p>
            {tramiteSearchTerm && (
              <button
                onClick={() => setTramiteSearchTerm('')}
                className="mt-4 btn btn-primary btn-sm"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg">
            <table className="table table-zebra">
              <thead className="bg-primary text-primary-content sticky top-0 z-10">
                <tr>
                  <th>#</th>
                  <th 
                    className="cursor-pointer hover:bg-primary-focus"
                    onClick={() => handleTramiteSort('tramite')}
                  >
                    <div className="flex items-center gap-2">
                      Trámite
                      {tramiteSortConfig.key === 'tramite' && (
                        <span>{tramiteSortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="cursor-pointer hover:bg-primary-focus"
                    onClick={() => handleTramiteSort('dependencia')}
                  >
                    <div className="flex items-center gap-2">
                      Dependencia
                      {tramiteSortConfig.key === 'dependencia' && (
                        <span>{tramiteSortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center cursor-pointer hover:bg-primary-focus"
                    onClick={() => handleTramiteSort('nivel_digitalizacion')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Nivel de Digitalización
                      {tramiteSortConfig.key === 'nivel_digitalizacion' && (
                        <span>{tramiteSortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center cursor-pointer hover:bg-primary-focus"
                    onClick={() => handleTramiteSort('fase_maxima')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Avance
                      {tramiteSortConfig.key === 'fase_maxima' && (
                        <span>{tramiteSortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center cursor-pointer hover:bg-primary-focus"
                    onClick={() => handleTramiteSort('total_acciones')}
                    title="Simplificación + Regulación"
                  >
                    <div className="flex items-center justify-center gap-2">
                      Acciones
                      {tramiteSortConfig.key === 'total_acciones' && (
                        <span>{tramiteSortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center cursor-pointer hover:bg-primary-focus"
                    onClick={() => handleTramiteSort('semaforo')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Estado
                      {tramiteSortConfig.key === 'semaforo' && (
                        <span>{tramiteSortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTramites.map((tramite, index) => {
                return (
                  <tr key={tramite.id}>
                    <td className="font-bold">{index + 1}</td>
                    <td className="font-medium">{tramite.tramite}</td>
                    <td className="text-sm opacity-70">{tramite.dependencia}</td>
                    <td className="text-center">
                      <div className={`badge badge-lg ${
                        tramite.nivel_digitalizacion >= 3.5 ? 'bg-green-500 text-white' :
                        tramite.nivel_digitalizacion >= 2.5 ? 'bg-lime-500 text-white' :
                        tramite.nivel_digitalizacion >= 1.5 ? 'bg-yellow-400 text-gray-800' :
                        tramite.nivel_digitalizacion >= 0.5 ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {tramite.nivel_digitalizacion}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5, 6].map((fase) => (
                          <div
                            key={fase}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              tramite[`fase${fase}_${
                                fase === 1 ? 'tramites_intervenidos' :
                                fase === 2 ? 'modelado' :
                                fase === 3 ? 'reingenieria' :
                                fase === 4 ? 'digitalizacion' :
                                fase === 5 ? 'implementacion' : 'liberacion'
                              }`]
                                ? 'bg-success text-success-content'
                                : 'bg-base-300 text-base-content opacity-30'
                            }`}
                          >
                            {fase}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="text-sm font-semibold text-primary">{tramite.total_acciones}</span>
                    </td>
                    <td className="text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto ${
                        tramite.semaforo === 'verde' ? 'bg-green-500' :
                        tramite.semaforo === 'ambar' ? 'bg-yellow-400' : 'bg-red-500'
                      }`} title={tramite.semaforo}></div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle de Dependencia */}
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
            <div className="bg-gradient-to-r from-[#9F2241] to-[#691C32] text-white p-6 sticky top-0 z-10 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 rounded-full shadow-md ${
                      selectedDep.semaforo === 'verde' ? 'bg-green-500' :
                      selectedDep.semaforo === 'ambar' ? 'bg-yellow-400' : 'bg-red-500'
                    }`} title={selectedDep.semaforo}></div>
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
                <div className="bg-[#9F2241] bg-opacity-10 p-4 rounded-xl text-center border-2 border-[#9F2241]">
                  <div className="text-4xl font-bold text-[#9F2241]">{selectedDep.total_tramites}</div>
                  <div className="text-sm text-gray-700 mt-1 font-semibold">Total de Trámites</div>
                </div>
                <div className="bg-[#235B4E] bg-opacity-10 p-4 rounded-xl border-2 border-[#235B4E]">
                  <div className="text-center mb-2">
                    <div className="text-3xl font-bold text-[#235B4E]">
                      {parseFloat(selectedDep.promedio_nivel).toFixed(1)}/4.3
                    </div>
                    <div className="text-sm text-gray-700 mt-1 font-semibold">Nivel Promedio de Digitalización</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-full transition-all rounded-full bg-gradient-to-r from-[#9F2241] to-[#D1899D]"
                      style={{ width: `${Math.min((parseFloat(selectedDep.promedio_nivel) / 4.3) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Avance por Etapas */}
              <div>
                <h3 className="text-xl font-bold mb-6 text-center text-gray-800">Avance por Etapas</h3>
                <p className="text-sm text-gray-600 text-center mb-6">Click en una etapa para ver los trámites</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { fase: 'E1', nombre: 'Trámites Intervenidos', count: selectedDep.fases.f1, num: 1 },
                    { fase: 'E2', nombre: 'Modelado', count: selectedDep.fases.f2, num: 2 },
                    { fase: 'E3', nombre: 'Reingeniería', count: selectedDep.fases.f3, num: 3 },
                    { fase: 'E4', nombre: 'Digitalización', count: selectedDep.fases.f4, num: 4 },
                    { fase: 'E5', nombre: 'Implementación', count: selectedDep.fases.f5, num: 5 },
                    { fase: 'E6', nombre: 'Liberación', count: selectedDep.fases.f6, num: 6 },
                  ].map((item) => {
                    const percentage = selectedDep.total_tramites > 0 
                      ? ((item.count / selectedDep.total_tramites) * 100).toFixed(0) 
                      : 0;
                    const isSelected = selectedFase === item.num;

                    return (
                      <button
                        key={item.fase}
                        onClick={() => handleFaseClick(item.num, selectedDep.dependencia)}
                        className={`text-center transition-all hover:scale-105 ${
                          isSelected ? 'ring-4 ring-[#9F2241] ring-offset-2' : ''
                        }`}
                        disabled={item.count === 0}
                      >
                        <div className="relative mb-2">
                          <svg className="w-20 h-20 mx-auto transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="transparent"
                              className="text-gray-200"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              stroke="url(#gradient)"
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={`${2 * Math.PI * 36}`}
                              strokeDashoffset={`${2 * Math.PI * 36 * (1 - percentage / 100)}`}
                              className="transition-all duration-1000"
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{stopColor: '#9F2241', stopOpacity: 1}} />
                                <stop offset="100%" style={{stopColor: '#F5E6E9', stopOpacity: 1}} />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-800">{percentage}%</span>
                          </div>
                        </div>
                        <div className="font-semibold text-sm text-gray-800">{item.fase}</div>
                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">{item.nombre}</div>
                        <div className="text-xs font-bold mt-1 text-[#9F2241]">
                          {formatNumber(item.count)} trámites
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lista de Trámites por Etapa */}
              {selectedFase && tramitesPorFase.length > 0 && (
                <div className="bg-[#9F2241] bg-opacity-5 p-6 rounded-xl border-2 border-[#9F2241]">
                  <h3 className="text-lg font-bold mb-4 text-gray-800">
                    Trámites en Etapa {selectedFase} ({tramitesPorFase.length})
                  </h3>
                  <div className="max-h-60 overflow-y-auto">
                    <ul className="space-y-2">
                      {tramitesPorFase.map((tramite, idx) => (
                        <li key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{tramite.tramite}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Nivel de digitalización: <span className="font-semibold">{tramite.nivel_digitalizacion}</span>
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFase(null);
                      setTramitesPorFase([]);
                    }}
                    className="mt-4 btn btn-sm btn-outline btn-primary w-full"
                  >
                    Cerrar lista
                  </button>
                </div>
              )}

              
              {/* Botón de cerrar */}
              <div className="flex justify-center pt-4 border-t">
                <button
                  onClick={() => {
                    setSelectedDep(null);
                    setSelectedFase(null);
                    setTramitesPorFase([]);
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-[#9F2241] to-[#691C32] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Volver al Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Trámites por Etapa Global */}
      {selectedGlobalEtapa && tramitesPorEtapaGlobal.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setSelectedGlobalEtapa(null);
            setTramitesPorEtapaGlobal([]);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#9F2241] to-[#691C32] text-white p-6 sticky top-0 z-10 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold">Etapa {selectedGlobalEtapa.num}: {selectedGlobalEtapa.nombre}</h2>
                  <p className="text-white text-opacity-90 mt-2">
                    {tramitesPorEtapaGlobal.length} trámites en esta etapa
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedGlobalEtapa(null);
                    setTramitesPorEtapaGlobal([]);
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Buscador */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar trámite o dependencia..."
                      className="input input-bordered w-full pr-10"
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {filteredAndSortedModalTramites.length} de {tramitesPorEtapaGlobal.length} trámites
                </div>
              </div>

              {/* Tabla de Trámites */}
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead className="bg-[#9F2241] text-white">
                    <tr>
                      <th className="text-center">#</th>
                      <th 
                        className="cursor-pointer hover:bg-[#691C32] max-w-[280px]"
                        onClick={() => handleModalSort('tramite')}
                      >
                        Trámite {modalSortConfig.key === 'tramite' && (modalSortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="cursor-pointer hover:bg-[#691C32]"
                        onClick={() => handleModalSort('dependencia')}
                      >
                        Dependencia {modalSortConfig.key === 'dependencia' && (modalSortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="cursor-pointer hover:bg-[#691C32] text-center"
                        onClick={() => handleModalSort('nivel_digitalizacion')}
                      >
                        Nivel de Digitalización {modalSortConfig.key === 'nivel_digitalizacion' && (modalSortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      {selectedGlobalEtapa.num === 3 ? (
                        <th className="text-center min-w-[140px]">
                          <div className="text-center">Acciones</div>
                          <div className="flex justify-center mt-1 text-xs font-normal">
                            <span className="w-10 text-center" title="Acciones de Simplificación">S</span>
                            <span className="w-10 text-center border-l border-white/30" title="Acciones de Regulación">R</span>
                            <span className="w-12 text-center border-l border-white/30">Total</span>
                          </div>
                        </th>
                      ) : (
                        <th className="text-center">Avance</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedModalTramites.map((tramite, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="font-bold text-center">{index + 1}</td>
                        <td className="font-medium max-w-[280px] truncate" title={tramite.tramite}>{tramite.tramite}</td>
                        <td className="text-sm text-gray-600">{tramite.dependencia}</td>
                        <td className="text-center">
                          <span className="badge badge-lg bg-[#235B4E] text-white font-semibold">
                            {tramite.nivel_digitalizacion}
                          </span>
                        </td>
                        <td>
                          {selectedGlobalEtapa.num === 3 ? (
                            <div className="flex justify-center items-center">
                              <span className="w-10 text-center font-semibold text-gray-700">{tramite.s || 0}</span>
                              <span className="w-10 text-center font-semibold text-gray-700 border-l border-gray-300">{tramite.r || 0}</span>
                              <span className="w-12 text-center font-bold text-gray-800 border-l border-gray-300">{(tramite.s || 0) + (tramite.r || 0)}</span>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-center">
                              {[
                                { num: 1, completada: tramite.fase1_tramites_intervenidos },
                                { num: 2, completada: tramite.fase2_modelado },
                                { num: 3, completada: tramite.fase3_reingenieria },
                                { num: 4, completada: tramite.fase4_digitalizacion },
                                { num: 5, completada: tramite.fase5_implementacion },
                                { num: 6, completada: tramite.fase6_liberacion },
                              ].map((etapa) => (
                                <div
                                  key={etapa.num}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    etapa.completada
                                      ? 'bg-gradient-to-br from-[#9F2241] to-[#691C32] text-white'
                                      : 'bg-gray-200 text-gray-400'
                                  }`}
                                  title={`Etapa ${etapa.num}${etapa.completada ? ' - Completada' : ''}`}
                                >
                                  E{etapa.num}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botón Cerrar */}
              <div className="mt-6 flex justify-center pt-4 border-t">
                <button
                  onClick={() => {
                    setSelectedGlobalEtapa(null);
                    setTramitesPorEtapaGlobal([]);
                    setModalSearchTerm('');
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-[#9F2241] to-[#691C32] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
