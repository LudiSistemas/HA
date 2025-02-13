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
    console.log('No data provided to WeatherChart');
    return null;
  }

  console.log('WeatherChart received data points:', data.length);
  console.log('Sample data point:', data[0]); // Debug first data point

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
      console.error('Error formatting timestamp:', timestamp, e);
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
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: 'rgb(75, 192, 192)',
          pointHoverBorderColor: 'white',
          pointHoverBorderWidth: 2,
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
          backgroundColor: 'rgba(44, 46, 64, 0.9)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
        },
      },
      scales: {
        y: {
          beginAtZero: sensorType === 'rain',
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false,
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              size: 12,
            },
            padding: 8,
          },
        },
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false,
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 12,
            font: {
              size: 11,
            },
            padding: 8,
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
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        }
      }
    };

    return (
      <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
        <Line data={chartData} options={options} />
      </div>
    );
  } catch (error) {
    console.error('Error rendering WeatherChart:', error, data);
    return <div>Error rendering chart</div>;
  }
};

export default WeatherChart; 