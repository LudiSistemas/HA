import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import ChartDisplay from './displays/ChartDisplay';
import WindCompass from './displays/WindCompass';

const glow = keyframes`
  0% {
    box-shadow: 0 0 5px #0ff, 0 0 10px #0ff, 0 0 15px #0ff;
  }
  50% {
    box-shadow: 0 0 10px #0ff, 0 0 20px #0ff, 0 0 30px #0ff;
  }
  100% {
    box-shadow: 0 0 5px #0ff, 0 0 10px #0ff, 0 0 15px #0ff;
  }
`;

const Container = styled.div`
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #1a1b26;
  min-height: 100vh;

  @media (max-width: 768px) {
    padding: 0.5rem;
    gap: 0.5rem;
  }
`;

const WeatherCard = styled.div`
  background: rgba(16, 16, 28, 0.95);
  border-radius: 15px;
  padding: 20px;
  margin: 10px;
  width: 90%;
  max-width: 600px;
  border: 1px solid #0ff;
  animation: ${glow} 2s ease-in-out infinite;

  @media (min-width: 1024px) {
    width: 80vw;
    max-width: 1200px;
  }

  @media (min-width: 1440px) {
    width: 65vw;
  }
`;

const Value = styled.span`
  font-size: 2.5em;
  font-weight: bold;
  color: #0ff;
  text-shadow: 0 0 10px #0ff;
`;

const Label = styled.div`
  font-size: 1.2em;
  color: #888;
  margin-bottom: 5px;
`;

const LastUpdated = styled.div`
  font-size: 0.8em;
  color: #666;
  margin-top: 10px;
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  text-align: center;
  padding: 20px;
  animation: ${glow} 2s ease-in-out infinite;
  border: 1px solid #ff4444;
  border-radius: 10px;
  margin: 20px;
`;

const WarningMessage = styled.div`
  color: ${props => props.level === 'high' ? '#ff4444' : '#ffff44'};
  font-size: 0.9em;
  margin-top: 5px;
  text-align: center;
`;

const componentRegistry = {
  ChartDisplay,
  WindCompass
};

const WeatherDisplay = ({ data, error }) => {
  const [historicalData, setHistoricalData] = useState({});
  const [timeOffset, setTimeOffset] = useState(0);
  const [configuredSensors, setConfiguredSensors] = useState([]);

  // Debug incoming data
  useEffect(() => {
    console.log('Received data:', data);
  }, [data]);

  // Parse sensor configuration
  useEffect(() => {
    try {
      const configString = import.meta.env.VITE_SENSOR_CONFIG;
      const sensorConfig = JSON.parse(configString);
      
      const sensors = Object.entries(sensorConfig)
        .map(([sensorId, config]) => ({
          sensorId,
          ...config
        }))
        .sort((a, b) => a.position - b.position);

      console.log('Configured sensors:', sensors);
      setConfiguredSensors(sensors);
    } catch (err) {
      console.error('Error parsing sensor config:', err);
    }
  }, []);

  // Fetch historical data for a sensor
  const fetchHistory = async (sensorId, offset = 0) => {
    try {
      console.log(`Fetching history for ${sensorId} with offset ${offset}`);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/sensors/${sensorId}/history?offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const history = await response.json();
      console.log(`Received history for ${sensorId}:`, history);
      return history;
    } catch (err) {
      console.error(`Error fetching history for ${sensorId}:`, err);
      return null;
    }
  };

  // Fetch historical data for all configured sensors
  const fetchAllHistory = async (offset = 0) => {
    if (!data) return;

    try {
      const historyPromises = configuredSensors.map(async (sensor) => {
        const history = await fetchHistory(sensor.sensorId, offset);
        return [sensor.sensorId, history];
      });

      const histories = await Promise.all(historyPromises);
      const historyMap = Object.fromEntries(histories);
      console.log('All historical data:', historyMap);
      setHistoricalData(historyMap);
    } catch (err) {
      console.error('Error fetching historical data:', err);
    }
  };

  useEffect(() => {
    if (!data || Object.keys(data).length === 0) {
      console.log('No sensor data available yet');
      return;
    }
    console.log('Setting up history fetch');
    fetchAllHistory(timeOffset);
    const interval = setInterval(() => fetchAllHistory(timeOffset), 300000);
    return () => clearInterval(interval);
  }, [configuredSensors, timeOffset, data]);

  const handleOffsetChange = (newOffset) => {
    setTimeOffset(newOffset);
  };

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  const renderSensor = (sensorConfig) => {
    const Component = componentRegistry[sensorConfig.component];
    if (!Component) {
      console.error(`Component ${sensorConfig.component} not found in registry`);
      return null;
    }

    // Directly use the sensor data from the data prop
    const sensorData = data[sensorConfig.sensorId];
    
    // Combine current sensor data with historical data
    const combinedData = {
      ...sensorData,
      entity_id: sensorConfig.sensorId,
      history: historicalData[sensorConfig.sensorId]
    };

    return (
      <Component 
        key={sensorConfig.sensorId}
        data={combinedData}
        config={sensorConfig}
        onOffsetChange={handleOffsetChange}
        currentOffset={timeOffset}
      />
    );
  };

  return (
    <Container>
      {configuredSensors.map(renderSensor)}
    </Container>
  );
};

export default WeatherDisplay; 