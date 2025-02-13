import React, { useState } from 'react';
import styled from 'styled-components';
import WeatherChart from '../charts/WeatherChart';

const ChartContainer = styled.div`
  padding: 2rem;
  background: rgba(35, 38, 45, 0.5);
  border-radius: 25px;
  margin: 1rem auto;
  width: 95%;
  max-width: 1200px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);

  @media (min-width: 1400px) {
    max-width: 1400px;
  }

  @media (min-width: 1800px) {
    max-width: 1600px;
  }
`;

const Title = styled.h3`
  font-family: 'Georgia', serif;
  color: white;
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 500;
  text-align: center;

  @media (min-width: 1400px) {
    font-size: 3rem;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 0.5rem 2rem 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-family: 'Courier New', monospace;
`;

const StatItem = styled.div`
  text-align: center;
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
`;

const NavButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ChartDisplay = ({ data, config }) => {
  const [offset, setOffset] = useState(0);

  // Early validation of required props
  if (!data) {
    console.log('No data provided to ChartDisplay');
    return null;
  }

  if (!config) {
    console.log('No config provided to ChartDisplay');
    return null;
  }

  // Safely access history data with fallbacks
  const historyData = data.history || {};
  const historyArray = historyData.history || [];
  const min = historyData.min ?? null;
  const max = historyData.max ?? null;

  console.log('ChartDisplay data:', {
    entityId: data.entity_id,
    historyData,
    min,
    max,
    config
  });

  const handlePrevDay = () => {
    setOffset(prev => prev + 1);
  };

  const handleNextDay = () => {
    if (offset > 0) {
      setOffset(prev => prev - 1);
    }
  };

  const formatDate = (offset) => {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Safely format min/max values
  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const precision = config.precision || 1;
    const unit = config.unit || '';
    try {
      return `${Number(value).toFixed(precision)}${unit}`;
    } catch (error) {
      console.error('Error formatting value:', error);
      return 'N/A';
    }
  };

  return (
    <ChartContainer>
      <Title>{config.display || 'Sensor Data'}</Title>
      <StatsContainer>
        <StatItem>Min: {formatValue(min)}</StatItem>
        <StatItem>{formatDate(offset)}</StatItem>
        <StatItem>Max: {formatValue(max)}</StatItem>
      </StatsContainer>
      <WeatherChart 
        data={historyArray}
        unit={data.attributes?.unit_of_measurement || ''}
        precision={config.precision || 1}
        sensorType={data.entity_id?.includes('rain') ? 'rain' : 'default'}
        entityId={data.entity_id}
      />
      <NavigationContainer>
        <NavButton onClick={handlePrevDay}>← Previous Day</NavButton>
        <NavButton onClick={handleNextDay} disabled={offset === 0}>Next Day →</NavButton>
      </NavigationContainer>
    </ChartContainer>
  );
};

export default ChartDisplay; 