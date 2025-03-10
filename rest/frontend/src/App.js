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
  const [chartKey, setChartKey] = useState(Date.now()); // Add a key to force chart re-render
  const [retryCount, setRetryCount] = useState(0);

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

  // Function to fetch data from the API
  const fetchData = async (startTime, endTime) => {
    try {
      setLoading(true);
      
      // Log the time range we're fetching
      console.log(`Fetching data from ${startTime} to ${endTime}`);
      
      // Construct the URL with query parameters
      let url = '/api/power/stats';
      
      // Add query parameters if provided
      const params = new URLSearchParams();
      
      // Always use explicit start_time and end_time for better control
      if (startTime && endTime) {
        params.append('start_time', startTime);
        params.append('end_time', endTime);
      } else if (timeRange) {
        // If no specific times provided, calculate them based on timeRange
        const endDate = new Date();
        let startDate;
        
        if (timeRange === 1) {
          // For "Today", use exactly 24 hours ago
          startDate = new Date(endDate);
          startDate.setHours(endDate.getHours() - 24);
        } else {
          // For other ranges, use the specified number of days
          startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - timeRange);
        }
        
        params.append('start_time', startDate.toISOString());
        params.append('end_time', endDate.toISOString());
        console.log(`Calculated time range: from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      }
      
      // Append the query string to the URL if we have parameters
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log(`API request URL: ${url}`);
      
      const response = await api.get(url);
      setPowerStats(response.data);
      
      // Force chart re-render by updating the key
      setChartKey(Date.now());
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Greška pri učitavanju podataka. Molimo pokušajte ponovo kasnije.');
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when component mounts or timeRange changes
  useEffect(() => {
    // Set initial time range to a valid value (1, 5, or 10)
    const validTimeRanges = [1, 5, 10];
    if (!validTimeRanges.includes(timeRange)) {
      // If current timeRange is not valid, set it to 1 day
      setTimeRange(1);
    }
    
    // Always calculate explicit start and end times
    const endDate = new Date();
    let startDate;
    
    if (timeRange === 1) {
      // For "Today", use exactly 24 hours ago
      startDate = new Date(endDate);
      startDate.setHours(endDate.getHours() - 24);
    } else {
      // For other ranges, use the specified number of days
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - timeRange);
    }
    
    console.log(`Initial fetch for time range: ${timeRange} days, from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    fetchData(startDate.toISOString(), endDate.toISOString());

    // Set up polling using the configured interval
    const intervalId = setInterval(() => {
      // For each poll, recalculate the time range to ensure we always have the latest data
      const now = new Date();
      let start;
      
      if (timeRange === 1) {
        // For "Today", use exactly 24 hours ago from now
        start = new Date(now);
        start.setHours(now.getHours() - 24);
      } else {
        // For other ranges, use the specified number of days
        start = new Date(now);
        start.setDate(now.getDate() - timeRange);
      }
      
      console.log(`Polling for time range: ${timeRange} days, from ${start.toISOString()} to ${now.toISOString()}`);
      fetchData(start.toISOString(), now.toISOString());
    }, REFRESH_INTERVAL);

    // Clean up on component unmount
    return () => clearInterval(intervalId);
  }, [timeRange]); // This dependency array ensures the effect runs when timeRange changes

  // Effect to retry on error, with exponential backoff
  useEffect(() => {
    if (error && retryCount < 5) {
      const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
      console.log(`Retrying in ${backoffTime/1000} seconds (attempt ${retryCount + 1}/5)...`);
      
      const retryTimer = setTimeout(() => {
        fetchData(null, null);
      }, backoffTime);
      
      return () => clearTimeout(retryTimer);
    }
  }, [error, retryCount]);

  // Handle time range change
  const handleTimeRangeChange = (days) => {
    setTimeRange(days);
    
    // Calculate the start date based on the selected time range
    const endDate = new Date();
    let startDate;
    
    if (days === 1) {
      // For "Today", use exactly 24 hours ago
      startDate = new Date(endDate);
      startDate.setHours(endDate.getHours() - 24);
    } else {
      // For other ranges, use the specified number of days
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - days);
    }
    
    console.log(`Setting time range: ${days} days, from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Trigger data fetch with the new time range
    fetchData(startDate.toISOString(), endDate.toISOString());
  };

  // Handle manual refresh
  const handleManualRefresh = () => {
    fetchData(null, null);
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

    // Define threshold for obvious measurement errors
    const ERROR_THRESHOLD = 100;

    // Sort data by timestamp
    const sortedData = [...phaseData.voltage_data].sort((a, b) => new Date(a[0]) - new Date(b[0]));
    
    // Calculate the start time for filtering (for "Today" option)
    let startTimeFilter = null;
    if (timeRange === 1) {
      const now = new Date();
      startTimeFilter = new Date(now);
      startTimeFilter.setHours(now.getHours() - 24);
      console.log(`Filtering data for last 24 hours, starting from: ${startTimeFilter.toISOString()}`);
    }
    
    // Filter data by time range if needed (for "Today" option)
    let filteredByTimeData = sortedData;
    if (startTimeFilter) {
      filteredByTimeData = sortedData.filter(item => {
        const itemDate = new Date(item[0]);
        return itemDate >= startTimeFilter;
      });
      console.log(`Filtered data points by time: ${filteredByTimeData.length} out of ${sortedData.length}`);
      
      // If we have very few points after filtering, use all data
      if (filteredByTimeData.length < 10 && sortedData.length > 10) {
        console.log("Too few points after filtering, using all available data");
        filteredByTimeData = sortedData;
      }
    }
    
    // Determine how many data points to show based on time range
    let dataPoints;
    if (timeRange <= 1) {
      // For 1 day, show all data points without sampling
      dataPoints = filteredByTimeData;
      console.log(`Using all ${dataPoints.length} data points for 24-hour view`);
    } else if (timeRange <= 5) {
      // For 5 days, sample appropriately
      const samplingRate = Math.max(1, Math.floor(filteredByTimeData.length / (24 * 5)));
      dataPoints = filteredByTimeData.filter((_, index) => index % samplingRate === 0);
      console.log(`Sampled to ${dataPoints.length} data points for 5-day view (rate: ${samplingRate})`);
    } else {
      // For 10 days, sample more aggressively
      const samplingRate = Math.max(1, Math.floor(filteredByTimeData.length / 150));
      dataPoints = filteredByTimeData.filter((_, index) => index % samplingRate === 0);
      console.log(`Sampled to ${dataPoints.length} data points for 10-day view (rate: ${samplingRate})`);
    }
    
    // If we still have too many points, limit to the most recent ones
    const maxPoints = 300; // Increased from 200 to show more detail
    if (dataPoints.length > maxPoints) {
      console.log(`Limiting from ${dataPoints.length} to ${maxPoints} data points`);
      dataPoints = dataPoints.slice(-maxPoints);
    }
    
    // Make sure we have at least some minimum number of points
    const minPoints = 24; // At least one point per hour for daily view
    if (dataPoints.length < minPoints && filteredByTimeData.length >= minPoints) {
      console.log(`Too few points (${dataPoints.length}), increasing to at least ${minPoints}`);
      const samplingRate = Math.floor(filteredByTimeData.length / minPoints);
      dataPoints = filteredByTimeData.filter((_, index) => index % Math.max(1, samplingRate) === 0);
    }
    
    // Log the number of data points
    console.log(`Using ${dataPoints.length} data points for chart with time range ${timeRange} days`);

    // Format the dates for display
    const labels = dataPoints.map(item => {
      try {
        const date = new Date(item[0]);
        if (timeRange <= 1) {
          // For 1 day, show hours and minutes
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else if (timeRange <= 5) {
          // For 5 days, show day and hour
          return `${date.getDate()}.${date.getMonth() + 1} ${date.getHours()}h`;
        } else {
          // For 10 days, show date only
          return `${date.getDate()}.${date.getMonth() + 1}`;
        }
      } catch (e) {
        console.error('Error formatting date:', e, item[0]);
        return 'Invalid date';
      }
    });

    const voltageData = dataPoints.map(item => {
      try {
        const voltage = parseFloat(item[1]);
        // Filter out only obvious errors (below 100V)
        return isNaN(voltage) || voltage < ERROR_THRESHOLD ? null : voltage;
      } catch (e) {
        console.error('Error parsing voltage:', e, item[1]);
        return null;
      }
    }).filter(v => v !== null);

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
          pointRadius: timeRange <= 1 ? 2 : 1, // Larger points for daily view
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

  // Get chart title based on time range
  const getChartTitle = () => {
    if (timeRange === 1) return 'Istorija napona (24 sata)';
    if (timeRange === 5) return 'Istorija napona (5 dana)';
    if (timeRange === 10) return 'Istorija napona (10 dana)';
    return `Istorija napona (${timeRange} dana)`;
  };

  // Format voltage value for display
  const formatVoltage = (voltage) => {
    if (voltage === null || voltage === undefined || isNaN(voltage) || voltage <= 0) {
      return 'N/A';
    }
    return voltage.toFixed(1);
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
        text: getChartTitle(),
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
        {/* Time range selector and refresh button */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Vremenski period:</h2>
            <button 
              onClick={handleManualRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Osvežavanje...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Osveži
                </>
              )}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 5, 10].map(days => (
              <button
                key={days}
                onClick={() => handleTimeRangeChange(days)}
                className={`px-4 py-2 rounded-md ${
                  timeRange === days 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
                disabled={loading}
              >
                {days === 1 ? 'Danas' : `${days} dana`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Učitavanje podataka...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <div className="flex">
              <div className="py-1">
                <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
                </svg>
              </div>
              <div>
                <p className="font-bold">Greška!</p>
                <p className="text-sm">{error}</p>
                {retryCount >= 5 && (
                  <button 
                    onClick={handleManualRefresh}
                    className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
                  >
                    Pokušaj ponovo
                  </button>
                )}
              </div>
            </div>
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
                        <p className="text-xl font-semibold">{formatVoltage(data.avg_voltage)} V</p>
                      </div>
                      <div className="bg-gray-100 p-2 rounded">
                        <p className="text-sm text-gray-500">U opsegu</p>
                        <p className="text-xl font-semibold">{data.in_range_percentage.toFixed(1)}%</p>
                      </div>
                      <div className="bg-gray-100 p-2 rounded">
                        <p className="text-sm text-gray-500">Min. napon</p>
                        <p className="text-xl font-semibold">{formatVoltage(data.min_voltage)} V</p>
                      </div>
                      <div className="bg-gray-100 p-2 rounded">
                        <p className="text-sm text-gray-500">Max. napon</p>
                        <p className="text-xl font-semibold">{formatVoltage(data.max_voltage)} V</p>
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
                    <h2 className="text-xl font-bold mb-4">{phaseName} - {getChartTitle()}</h2>
                    <div className="h-80">
                      {lineData ? (
                        <Line 
                          key={`${sensorId}-${chartKey}`} 
                          data={lineData} 
                          options={lineChartOptions} 
                        />
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
        
        {/* Information about the measurement device */}
        <div className="mt-8 bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Informacije o merenju</h2>
          <p className="text-sm text-gray-700">
            Merenja su izvršena pomoću uređaja <a href="https://minor.rs/pametni-releji/shelly-3em-wifi-modul-za-3-fazno-merenje-potrosnje.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Shelly 3EM - WiFi modul za 3-fazno merenje potrošnje</a>.
          </p>
          <p className="text-sm text-gray-700 mt-2">
            Shelly 3EM je trofazni WiFi merač energije i kontrolor kontaktora koji služi za praćenje pojedinačne potrošnje bilo kojih kućnih, kancelarijskih i profesionalnih uređaja. Uređaj ima tri nezavisna merna kanala do 120A, jednu kontrolu kontaktora, 365 dana interne memorije i mogućnost merenja napona sa podešavanjem i javljanjem alarma.
          </p>
        </div>
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