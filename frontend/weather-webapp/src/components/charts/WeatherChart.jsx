import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const WeatherChart = ({ data, unit, precision = 1, sensorType = 'default' }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch (e) {
      return '';
    }
  };

  try {
    const chartData = {
      labels: data.map(item => formatTime(item.last_updated)),
      datasets: [
        {
          label: unit,
          data: data.map(item => Number(parseFloat(item.state || 0).toFixed(precision))),
          fill: false,
          borderColor: 'rgb(96, 245, 245)',
          backgroundColor: 'rgba(96, 245, 245, 0.5)',
          borderWidth: 1.5,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 3,
          pointHoverBackgroundColor: 'rgb(96, 245, 245)',
          pointHoverBorderColor: 'white',
          pointHoverBorderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(35, 38, 45, 0.9)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 8,
          displayColors: false,
          titleFont: {
            size: 12
          },
          bodyFont: {
            size: 12
          }
        },
      },
      scales: {
        y: {
          beginAtZero: sensorType === 'rain',
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false,
            lineWidth: 0.5
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            font: {
              size: 11,
              family: "'Courier New', monospace"
            },
            padding: 10,
            stepSize: 1
          },
          border: {
            display: false
          }
        },
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false,
            lineWidth: 0.5
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 12,
            font: {
              size: 10,
              family: "'Courier New', monospace"
            },
            padding: 5
          },
          border: {
            display: false
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      layout: {
        padding: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 10
        }
      }
    };

    return (
      <div style={{ height: '400px', width: '100%' }}>
        <Line data={chartData} options={options} />
      </div>
    );
  } catch (error) {
    return null;
  }
};

export default WeatherChart; 