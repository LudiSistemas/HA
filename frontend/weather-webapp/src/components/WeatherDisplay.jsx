import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { componentRegistry } from './displays';
import WeatherConditions from './WeatherConditions';

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
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-height: 100vh;
  background: #1a1a2e;
  color: #fff;
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

const WeatherDisplay = ({ data, error }) => {
  const [historicalData, setHistoricalData] = useState({});
  
  // Safely parse the sensor config
  let sensorConfig = {};
  try {
    const configString = import.meta.env.VITE_SENSOR_CONFIG;
    if (configString) {
      // Remove 'VITE_SENSOR_CONFIG=' if it exists in the string
      const cleanConfigString = configString.replace('VITE_SENSOR_CONFIG=', '');
      sensorConfig = JSON.parse(cleanConfigString);
    }
  } catch (e) {
    console.error('Failed to parse VITE_SENSOR_CONFIG:', e);
    console.log('Raw config:', import.meta.env.VITE_SENSOR_CONFIG);
  }

  // Add debug logs
  console.log('Environment variables:', import.meta.env);
  console.log('Parsed sensor config:', sensorConfig);
  console.log('Raw data:', data);
  console.log('Historical data:', historicalData);

  // Filter and sort sensors based on configuration
  const configuredSensors = data?.filter(sensor => 
    sensorConfig[sensor.entity_id]
  ).sort((a, b) => 
    (sensorConfig[a.entity_id]?.position || 0) - (sensorConfig[b.entity_id]?.position || 0)
  );

  console.log('Configured sensors:', configuredSensors);

  // Render configured component for each sensor
  const renderSensor = (sensor) => {
    const config = sensorConfig[sensor.entity_id];
    if (!config) return null;

    const Component = componentRegistry[config.component];
    if (!Component) {
      console.error(`Component ${config.component} not found for sensor ${sensor.entity_id}`);
      return null;
    }

    return (
      <Component 
        key={sensor.entity_id}
        data={{
          ...sensor,
          history: historicalData[sensor.entity_id]
        }}
        config={config}
      />
    );
  };

  const fetchHistory = async (sensorId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/sensors/${sensorId}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistoricalData(prev => ({
          ...prev,
          [sensorId]: data
        }));
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    if (data) {
      data.forEach(sensor => {
        fetchHistory(sensor.entity_id);
      });
    }
  }, [data]);

  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <Container>
      <WeatherConditions currentData={data} pressureHistory={historicalData} />
      {configuredSensors?.map(renderSensor)}
    </Container>
  );
};

export default WeatherDisplay; 