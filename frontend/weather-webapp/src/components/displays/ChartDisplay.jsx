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
  box-sizing: border-box;

  @media (max-width: 768px) {
    width: 100%;
    margin: 0.5rem auto;
    padding: 1rem;
    border-radius: 15px;
  }

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

  @media (max-width: 768px) {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 0.5rem 2rem 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-family: 'Courier New', monospace;

  @media (max-width: 768px) {
    margin: 0.5rem 1rem 1rem;
    font-size: 0.9rem;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
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

  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ChartDisplay = ({ data, config, onOffsetChange, currentOffset }) => {
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
    config,
    currentOffset
  });

  const handlePrevDay = () => {
    onOffsetChange(currentOffset + 1);
  };

  const handleNextDay = () => {
    if (currentOffset > 0) {
      onOffsetChange(currentOffset - 1);
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
        <StatItem>{formatDate(currentOffset)}</StatItem>
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
        <NavButton onClick={handleNextDay} disabled={currentOffset === 0}>
          Next Day →
        </NavButton>
      </NavigationContainer>
    </ChartContainer>
  );
};

export default ChartDisplay; 