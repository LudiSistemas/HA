import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { sensorConfig } from '../config/sensors';
import WeatherChart from './WeatherChart';
import WindCompass from './WindCompass';

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

  @media (min-width: 768px) {
    width: 80%;
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

  const getSensorConfig = (entityId) => {
    return sensorConfig[entityId] || {
      name: entityId,
      precision: 1,
      icon: ''
    };
  };

  const formatValue = (value, precision) => {
    return Number(value).toFixed(precision);
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

  const renderValue = (sensor, config) => {
    const value = formatValue(sensor.state, config.precision);

    if (sensor.entity_id === 'sensor.ws2900_v2_02_03_wind_direction') {
      const speedSensor = data.find(s => s.entity_id === 'sensor.ws2900_v2_02_03_wind_speed');
      const gustSensor = data.find(s => s.entity_id === 'sensor.ws2900_v2_02_03_wind_gust');
      return (
        <WindCompass 
          direction={sensor.state}
          speed={speedSensor?.state}
          gust={gustSensor?.state}
        />
      );
    }

    if (sensor.entity_id === 'sensor.ws2900_v2_02_03_uv_index') {
      return (
        <>
          <Value>
            {value}
            {sensor.attributes.unit_of_measurement}
          </Value>
          <WarningMessage level={parseFloat(value) >= 6 ? 'high' : 'medium'}>
            {config.getWarning(value)}
          </WarningMessage>
        </>
      );
    }

    return (
      <Value>
        {value}
        {config.unit || sensor.attributes.unit_of_measurement}
      </Value>
    );
  };

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  return (
    <Container>
      {data?.map((sensor) => {
        const config = getSensorConfig(sensor.entity_id);
        return (
          <WeatherCard key={sensor.entity_id}>
            <Label>
              {config.icon} {config.name || sensor.attributes.friendly_name}
            </Label>
            {renderValue(sensor, config)}
            <WeatherChart 
              data={historicalData[sensor.entity_id]}
              unit={config.unit || sensor.attributes.unit_of_measurement}
              precision={config.precision}
            />
            <LastUpdated>
              Poslednji put ažurirano: {new Date(sensor.last_updated).toLocaleString()}
            </LastUpdated>
          </WeatherCard>
        );
      })}
    </Container>
  );
};

export default WeatherDisplay; 