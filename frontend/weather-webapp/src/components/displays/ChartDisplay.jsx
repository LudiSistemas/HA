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

  if (!data || !data.history) {
    return null;
  }

  const historyData = data.history || {};
  const { min, max } = historyData;

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

  return (
    <ChartContainer>
      <Title>{config.display}</Title>
      <StatsContainer>
        <StatItem>Min: {min !== null ? `${min.toFixed(config.precision || 1)}${config.unit || ''}` : 'N/A'}</StatItem>
        <StatItem>{formatDate(offset)}</StatItem>
        <StatItem>Max: {max !== null ? `${max.toFixed(config.precision || 1)}${config.unit || ''}` : 'N/A'}</StatItem>
      </StatsContainer>
      <WeatherChart 
        data={historyData.history || []}
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