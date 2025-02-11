import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import styled from 'styled-components';

const ChartContainer = styled.div`
  width: 100%;
  height: 200px;
  margin-top: 20px;

  @media (min-width: 1024px) {
    width: 100%;
    height: 300px;
    margin: 20px auto;
  }

  @media (min-width: 1440px) {
    height: 400px;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
  font-size: 0.9em;
  color: #888;

  @media (min-width: 1024px) {
    width: 100%;
    margin: 20px auto;
    font-size: 1em;
  }

  @media (min-width: 1440px) {
    font-size: 1.1em;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  color: #0ff;
  font-size: 1.1em;
  margin-top: 2px;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
`;

const NavButton = styled.button`
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid #0ff;
  color: #0ff;
  padding: 5px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-family: 'Roboto Mono', monospace;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TimeRange = styled.div`
  color: #888;
  text-align: center;
  margin-top: 5px;
  font-size: 0.9em;
`;

const WeatherChart = ({ data, unit, precision, sensorType, entityId }) => {
  const [timeOffset, setTimeOffset] = useState(0);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  
  const MAX_OFFSET = 30;

  useEffect(() => {
    console.log('Initial data:', data);
    if (data?.history) {
      setChartData(data);
    }
  }, [data]);

  useEffect(() => {
    console.log('Chart data updated:', chartData);
  }, [chartData]);

  if (!chartData?.history) {
    console.log('No chart data available');
    return null;
  }

  const formatValue = (value) => Number(value).toFixed(precision);

  const fetchHistoricalData = async (offset) => {
    if (offset > MAX_OFFSET) {
      setError('Ne možemo prikazati podatke starije od 30 dana');
      return;
    }
    
    try {
      setError(null);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/sensors/${entityId}/history?offset=${offset}`
      );
      
      if (response.ok) {
        const newData = await response.json();
        setChartData(newData);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Greška pri učitavanju podataka');
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setError('Greška pri učitavanju podataka');
    }
  };

  const handlePrevious = async () => {
    const newOffset = timeOffset + 1;
    setTimeOffset(newOffset);
    await fetchHistoricalData(newOffset);
  };

  const handleNext = async () => {
    const newOffset = timeOffset - 1;
    setTimeOffset(newOffset);
    await fetchHistoricalData(newOffset);
  };

  // Calculate time range for display
  const endTime = new Date();
  const startTime = new Date();
  endTime.setDate(endTime.getDate() - timeOffset);
  startTime.setDate(startTime.getDate() - timeOffset - 1);

  // Process data for chart
  let processedData = chartData.history.map(item => {
    const timestamp = item.last_updated || item.last_changed;
    if (!timestamp) {
      console.error('Missing timestamp for item:', item);
      return null;
    }
    return {
      time: new Date(timestamp).getTime(),
      value: parseFloat(item.state)
    };
  }).filter(Boolean); // Remove any null entries

  // Log processed data
  console.log('Processed data:', processedData);

  if (processedData.length === 0) {
    console.log('No valid data points after processing');
    return null;
  }

  // Special handling for rain data
  if (sensorType === 'rain') {
    processedData = processedData.filter((item, index, arr) => {
      const value = item.value;
      const prevValue = index > 0 ? arr[index - 1].value : 0;
      return value > 0 || prevValue > 0;
    });
  }

  // Get time domain to remove gaps
  const timeRange = processedData.reduce(
    (acc, item) => ({
      min: Math.min(acc.min, item.time),
      max: Math.max(acc.max, item.time),
    }),
    { min: Infinity, max: -Infinity }
  );

  return (
    <>
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={processedData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <XAxis
              dataKey="time"
              type="number"
              domain={[
                processedData[0]?.time || 0,
                processedData[processedData.length - 1]?.time || 0
              ]}
              tickFormatter={(time) => new Date(time).toLocaleTimeString()}
              stroke="#666"
            />
            <YAxis
              stroke="#666"
              domain={sensorType === 'rain' ? [0, 'auto'] : ['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{ 
                background: '#1a1a2e', 
                border: '1px solid #0ff',
                borderRadius: '4px',
                padding: '8px'
              }}
              labelFormatter={(time) => new Date(time).toLocaleString()}
              formatter={(value) => [value.toFixed(precision) + unit]}
            />
            {chartData.min !== undefined && (
              <ReferenceLine y={chartData.min} stroke="#4444ff" strokeDasharray="3 3" />
            )}
            {chartData.max !== undefined && (
              <ReferenceLine y={chartData.max} stroke="#ff4444" strokeDasharray="3 3" />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0ff"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <NavigationButtons>
        <NavButton 
          onClick={handlePrevious}
          disabled={timeOffset >= MAX_OFFSET}
        >
          ◀ 24h ranije
        </NavButton>
        <NavButton 
          onClick={handleNext} 
          disabled={timeOffset === 0}
        >
          24h kasnije ▶
        </NavButton>
      </NavigationButtons>
      {error && (
        <div style={{ color: '#ff4444', textAlign: 'center', marginTop: '10px' }}>
          {error}
        </div>
      )}
      <TimeRange>
        {startTime.toLocaleDateString()} {startTime.toLocaleTimeString().slice(0, 5)} - 
        {endTime.toLocaleDateString()} {endTime.toLocaleTimeString().slice(0, 5)}
      </TimeRange>
      <StatsContainer>
        <StatItem>
          <div>Minimum</div>
          <StatValue>{formatValue(chartData.min)}{unit}</StatValue>
        </StatItem>
        <StatItem>
          <div>Maximum</div>
          <StatValue>{formatValue(chartData.max)}{unit}</StatValue>
        </StatItem>
      </StatsContainer>
    </>
  );
};

export default WeatherChart; 