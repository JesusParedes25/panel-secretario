/**
 * Gráfica de Barras Apiladas Horizontales (Fases por Dependencia)
 * Panel Secretario - Gobierno de Hidalgo
 */

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StackedBarChart = ({ data }) => {
  // Calcular altura dinámica basada en número de dependencias
  const numDeps = data?.labels?.length || 10;
  const chartHeight = Math.max(400, numDeps * 45); // 45px por dependencia, mínimo 400px

  const options = {
    indexAxis: 'y', // Barras horizontales
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'center',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
          },
          generateLabels: function(chart) {
            const datasets = chart.data.datasets;
            return datasets.slice().reverse().map((dataset, i) => ({
              text: dataset.label,
              fillStyle: dataset.backgroundColor,
              strokeStyle: dataset.borderColor,
              lineWidth: dataset.borderWidth,
              hidden: !chart.isDatasetVisible(datasets.length - 1 - i),
              index: datasets.length - 1 - i,
            }));
          },
        },
      },
      title: {
        display: true,
        text: 'Avance por Dependencia (Ordenadas por Fases Avanzadas)',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.x || 0;
            return `${label}: ${value} trámite${value !== 1 ? 's' : ''}`;
          },
          footer: function(context) {
            let total = 0;
            context.forEach((item) => {
              total += item.parsed.x;
            });
            return `\nTotal: ${total} trámites`;
          },
        },
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleFont: {
          size: 13,
          weight: 'bold',
        },
        bodyFont: {
          size: 12,
        },
        footerFont: {
          size: 12,
          weight: 'bold',
        },
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de Trámites',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          autoSkip: false,
          callback: function(value, index) {
            const label = this.getLabelForValue(value);
            // Acortar si es muy largo (más de 45 caracteres)
            if (label.length > 45) {
              return label.substring(0, 42) + '...';
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="chart-container" style={{ height: `${chartHeight}px` }}>
        <Bar data={data} options={options} />
      </div>
      <div className="text-center text-sm opacity-70">
        <p>
          Las dependencias están ordenadas por avance: mayor peso a trámites en fases avanzadas (F6 &gt; F5 &gt; F4)
        </p>
      </div>
    </div>
  );
};

export default StackedBarChart;
