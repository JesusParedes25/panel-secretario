/**
 * Componente de Tarjeta KPI - Versión Moderna
 * Panel Secretario - Gobierno de Hidalgo
 */

import { formatNumber, formatPercentage } from '../utils/formatters';

const KPICard = ({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  trend,
  isPercentage = false,
  color = 'primary',
  showProgressBar = false,
  maxValue = 100,
  showPercentOfMax = false,
  progressLabel = null,
}) => {
  const colorConfig = {
    primary: {
      gradient: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/20',
      iconBg: 'bg-blue-500',
      customColor: null,
    },
    secondary: {
      gradient: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/20',
      iconBg: 'bg-purple-500',
      customColor: null,
    },
    accent: {
      gradient: 'from-amber-500 to-amber-600',
      shadow: 'shadow-amber-500/20',
      iconBg: 'bg-amber-500',
      customColor: null,
    },
    success: {
      gradient: 'from-green-500 to-green-600',
      shadow: 'shadow-green-500/20',
      iconBg: 'bg-green-500',
      customColor: null,
    },
    warning: {
      gradient: 'from-orange-500 to-orange-600',
      shadow: 'shadow-orange-500/20',
      iconBg: 'bg-orange-500',
      customColor: null,
    },
    error: {
      gradient: 'from-red-500 to-red-600',
      shadow: 'shadow-red-500/20',
      iconBg: 'bg-red-500',
      customColor: null,
    },
  };

  // Soporte para colores hexadecimales personalizados
  const isCustomColor = color && color.startsWith('#');
  const config = isCustomColor 
    ? {
        gradient: '', // No usar gradiente con colores custom
        shadow: 'shadow-gray-300/20',
        iconBg: '',
        customColor: color,
      }
    : colorConfig[color] || colorConfig.primary;

  return (
    <div 
      className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group ${!config.customColor ? config.shadow : ''}`}
      style={config.customColor ? { boxShadow: `0 4px 14px 0 ${config.customColor}20` } : {}}
    >
      {/* Barra de color superior */}
      {config.customColor ? (
        <div className="h-1.5" style={{ backgroundColor: config.customColor }}></div>
      ) : (
        <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`}></div>
      )}
      
      <div className="p-6">
        {/* Header con icono y badge */}
        <div className="flex items-start justify-between mb-4">
          {config.customColor ? (
            <div className="p-3 rounded-xl transition-all" style={{ backgroundColor: `${config.customColor}15` }}>
              {Icon && <Icon className="h-7 w-7" style={{ color: config.customColor }} />}
            </div>
          ) : (
            <div className={`p-3 rounded-xl ${config.iconBg} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
              {Icon && <Icon className={`h-7 w-7 ${config.iconBg.replace('bg-', 'text-')}`} />}
            </div>
          )}
          {trend && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
              trend > 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <span>{trend > 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        
        {/* Valor principal */}
        <div className="mb-3">
          {config.customColor ? (
            <div className="text-5xl font-extrabold leading-tight" style={{ color: config.customColor }}>
              {isPercentage ? formatPercentage(value) : formatNumber(value)}
            </div>
          ) : (
            <div className={`text-5xl font-extrabold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent leading-tight`}>
              {isPercentage ? formatPercentage(value) : formatNumber(value)}
            </div>
          )}
        </div>

        {/* Barra de progreso (opcional) */}
        {showProgressBar && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
              {config.customColor ? (
                <div
                  className="h-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ 
                    width: `${Math.min((parseFloat(value) / maxValue) * 100, 100)}%`,
                    backgroundColor: config.customColor 
                  }}
                >
                  <div className="h-full w-full bg-white/30"></div>
                </div>
              ) : (
                <div
                  className={`h-full bg-gradient-to-r ${config.gradient} transition-all duration-1000 ease-out shadow-lg`}
                  style={{ width: `${Math.min((parseFloat(value) / maxValue) * 100, 100)}%` }}
                >
                  <div className="h-full w-full bg-white/30"></div>
                </div>
              )}
            </div>
            {progressLabel ? (
              <div className="text-xs text-gray-500 mt-1.5 text-right">
                {progressLabel}
              </div>
            ) : (
              <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                {showPercentOfMax && (
                  <span className="font-semibold">
                    {((parseFloat(value) / maxValue) * 100).toFixed(1)}% de la meta
                  </span>
                )}
                <span className={showPercentOfMax ? '' : 'ml-auto'}>Meta 2025: {maxValue}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Título y subtítulo */}
        <div className="space-y-1">
          <h3 className="text-base font-bold text-gray-800">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Decoración de fondo */}
      {config.customColor ? (
        <div 
          className="absolute -right-4 -bottom-4 w-24 h-24 opacity-5 rounded-full group-hover:scale-110 transition-transform duration-500"
          style={{ backgroundColor: config.customColor }}
        ></div>
      ) : (
        <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${config.gradient} opacity-5 rounded-full group-hover:scale-110 transition-transform duration-500`}></div>
      )}
    </div>
  );
};

export default KPICard;
