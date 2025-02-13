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
          tension: 0.1,
          pointRadius: 1,
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
        },
      },
      scales: {
        y: {
          beginAtZero: sensorType === 'rain',
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
          }
        },
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 12 // Show fewer x-axis labels
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    };

    return (
      <div style={{ height: '300px', width: '100%' }}>
        <Line data={chartData} options={options} />
      </div>
    );
  } catch (error) {
    console.error('Error rendering WeatherChart:', error, data);
    return <div>Error rendering chart</div>;
  }
};

export default WeatherChart; 