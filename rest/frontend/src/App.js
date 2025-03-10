import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

// Get environment variables with fallbacks
const API_URL = process.env.REACT_APP_API_URL || '';
const REFRESH_INTERVAL = parseInt(process.env.REACT_APP_REFRESH_INTERVAL || '300000', 10);
const DEFAULT_TIME_RANGE = parseInt(process.env.REACT_APP_DEFAULT_TIME_RANGE || '30', 10);

// Create axios instance with base URL if provided
const api = axios.create({
  baseURL: API_URL,
});

function App() {
  const [powerStats, setPowerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(DEFAULT_TIME_RANGE);

  // Map sensor IDs to Serbian phase names
  const phaseNames = {
    'sensor.shellyem3_483fdac3eb39_channel_a_voltage': 'Faza 1',
    'sensor.shellyem3_483fdac3eb39_channel_b_voltage': 'Faza 2',
    'sensor.shellyem3_483fdac3eb39_channel_c_voltage': 'Faza 3'
  };

  // Colors for the charts
  const chartColors = {
    inRange: 'rgba(75, 192, 192, 0.8)',
    belowRange: 'rgba(255, 159, 64, 0.8)',
    aboveRange: 'rgba(255, 99, 132, 0.8)',
    borderColor: 'rgba(255, 255, 255, 1)'
  };

  // Function to fetch power stats
  const fetchPowerStats = async () => {
    try {
      setLoading(true);
      console.log(`Fetching power stats for ${timeRange} days...`);
      const response = await api.get(`/api/power/stats?days=${timeRange}`);
      console.log('Received power stats:', response.data);
      setPowerStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching power stats:', err);
      setError('Greška pri učitavanju podataka. Molimo pokušajte ponovo kasnije.');
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when component mounts or timeRange changes
  useEffect(() => {
    fetchPowerStats();

    // Set up polling using the configured interval
    const intervalId = setInterval(fetchPowerStats, REFRESH_INTERVAL);

    // Clean up on component unmount
    return () => clearInterval(intervalId);
  }, [timeRange]); // This dependency array ensures the effect runs when timeRange changes

  // Handle time range change
  const handleTimeRangeChange = (days) => {
    console.log(`Changing time range to ${days} days`);
    setTimeRange(days);
    // No need to call fetchPowerStats() here as the useEffect will trigger due to timeRange change
  };

  // Prepare pie chart data for a phase
  const getPieChartData = (phaseData) => {
    if (!phaseData) return null;

    return {
      labels: ['U opsegu (207V-253V)', 'Ispod opsega (<207V)', 'Iznad opsega (>253V)'],
      datasets: [
        {
          data: [
            phaseData.in_range_percentage,
            phaseData.below_range_percentage,
            phaseData.above_range_percentage
          ],
          backgroundColor: [
            chartColors.inRange,
            chartColors.belowRange,
            chartColors.aboveRange
          ],
          borderColor: [
            chartColors.borderColor,
            chartColors.borderColor,
            chartColors.borderColor
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare line chart data for a phase
  const getLineChartData = (phaseData) => {
    if (!phaseData || !phaseData.voltage_data || phaseData.voltage_data.length === 0) return null;

    // Sort data by timestamp and take the last 100 points for better visualization
    const sortedData = [...phaseData.voltage_data].sort((a, b) => new Date(a[0]) - new Date(b[0]));
    const limitedData = sortedData.slice(-100);

    const labels = limitedData.map(item => {
      const date = new Date(item[0]);
      return `${date.getDate()}.${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    });

    const voltageData = limitedData.map(item => item[1]);

    // Create horizontal lines for the acceptable range
    const minVoltageData = Array(labels.length).fill(phaseData.acceptable_range.min);
    const maxVoltageData = Array(labels.length).fill(phaseData.acceptable_range.max);
    const nominalVoltageData = Array(labels.length).fill(phaseData.acceptable_range.nominal);

    return {
      labels,
      datasets: [
        {
          label: 'Napon (V)',
          data: voltageData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          pointRadius: 1,
        },
        {
          label: 'Minimalni prihvatljivi napon (207V)',
          data: minVoltageData,
          borderColor: 'rgba(255, 159, 64, 0.8)',
          borderDash: [5, 5],
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'Maksimalni prihvatljivi napon (253V)',
          data: maxVoltageData,
          borderColor: 'rgba(255, 99, 132, 0.8)',
          borderDash: [5, 5],
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'Nominalni napon (230V)',
          data: nominalVoltageData,
          borderColor: 'rgba(54, 162, 235, 0.8)',
          borderDash: [2, 2],
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
        }
      ],
    };
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Istorija napona',
      },
    },
    scales: {
      y: {
        min: 180,
        max: 270,
        title: {
          display: true,
          text: 'Napon (V)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Vreme'
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Monitoring Kvaliteta Električne Energije</h1>
          <p className="text-sm mt-1">Prikaz napona po fazama (230V ±10%)</p>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {/* Time range selector */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Vremenski period:</h2>
          <div className="flex flex-wrap gap-2">
            {[1, 7, 14, 30].map(days => (
              <button
                key={days}
                onClick={() => handleTimeRangeChange(days)}
                className={`px-4 py-2 rounded-md ${
                  timeRange === days 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {days === 1 ? 'Danas' : `${days} dana`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Greška!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : powerStats ? (
          <div>
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {Object.entries(powerStats).map(([sensorId, data]) => {
                const phaseName = phaseNames[sensorId] || sensorId;
                return (
                  <div key={sensorId} className="bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-2">{phaseName}</h2>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-gray-100 p-2 rounded">
                        <p className="text-sm text-gray-500">Trenutni napon</p>
                        <p className="text-xl font-semibold">{data.avg_voltage ? data.avg_voltage.toFixed(1) : 'N/A'} V</p>
                      </div>
                      <div className="bg-gray-100 p-2 rounded">
                        <p className="text-sm text-gray-500">U opsegu</p>
                        <p className="text-xl font-semibold">{data.in_range_percentage.toFixed(1)}%</p>
                      </div>
                      <div className="bg-gray-100 p-2 rounded">
                        <p className="text-sm text-gray-500">Min. napon</p>
                        <p className="text-xl font-semibold">{data.min_voltage ? data.min_voltage.toFixed(1) : 'N/A'} V</p>
                      </div>
                      <div className="bg-gray-100 p-2 rounded">
                        <p className="text-sm text-gray-500">Max. napon</p>
                        <p className="text-xl font-semibold">{data.max_voltage ? data.max_voltage.toFixed(1) : 'N/A'} V</p>
                      </div>
                    </div>
                    
                    {/* Pie chart */}
                    <div className="h-64 mb-4">
                      {getPieChartData(data) && (
                        <Pie data={getPieChartData(data)} options={{ maintainAspectRatio: false }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Line charts */}
            <div className="space-y-6">
              {Object.entries(powerStats).map(([sensorId, data]) => {
                const phaseName = phaseNames[sensorId] || sensorId;
                const lineData = getLineChartData(data);
                
                return (
                  <div key={`line-${sensorId}`} className="bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">{phaseName} - Istorija napona</h2>
                    <div className="h-80">
                      {lineData ? (
                        <Line data={lineData} options={lineChartOptions} />
                      ) : (
                        <div className="flex justify-center items-center h-full">
                          <p className="text-gray-500">Nema dostupnih podataka za prikaz grafikona</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">Nema dostupnih podataka.</span>
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center">
          <p>© {new Date().getFullYear()} Monitoring Kvaliteta Električne Energije</p>
        </div>
      </footer>
    </div>
  );
}

export default App; 