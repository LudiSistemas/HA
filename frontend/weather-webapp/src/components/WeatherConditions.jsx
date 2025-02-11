import React from 'react';
import styled from 'styled-components';

const ConditionsContainer = styled.div`
  margin: 15px 0;
  padding: 10px;
  border-top: 1px solid #0ff3;
`;

const Condition = styled.div`
  color: #0ff;
  font-size: 1.1em;
  margin: 5px 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Prediction = styled.div`
  color: ${props => props.trend === 'improving' ? '#4dff4d' : 
    props.trend === 'worsening' ? '#ff4d4d' : '#ffff4d'};
  font-size: 0.9em;
  margin-top: 5px;
`;

const getWeatherCondition = (temp, humidity, pressure) => {
  if (!temp || !humidity || !pressure) return null;

  let conditions = [];
  
  // Temperature based conditions
  if (temp <= 0) conditions.push('❄️ Hladno');
  else if (temp > 30) conditions.push('🌡️ Veoma toplo');
  
  // Humidity based conditions
  if (humidity > 80) conditions.push('💧 Vlažno');
  else if (humidity < 30) conditions.push('🏜️ Suvo');
  
  return conditions.join(' • ') || '🌥️ Umereno';
};

const getPressureTrend = (pressureHistory) => {
  if (!pressureHistory?.history || pressureHistory.history.length < 2) return null;

  const recent = pressureHistory.history.slice(-6); // Last 6 readings
  const pressureChange = recent[recent.length - 1].state - recent[0].state;
  
  if (Math.abs(pressureChange) < 1) return {
    trend: 'stable',
    message: '🌤️ Očekuju se stabilni vremenski uslovi'
  };
  
  if (pressureChange > 0) return {
    trend: 'improving',
    message: '☀️ Očekuje se poboljšanje vremena'
  };
  
  return {
    trend: 'worsening',
    message: '🌧️ Moguće pogoršanje vremena'
  };
};

const WeatherConditions = ({ currentData, pressureHistory }) => {
  const temp = currentData.find(s => s.entity_id.includes('temperature'))?.state;
  const humidity = currentData.find(s => s.entity_id.includes('humidity'))?.state;
  const pressure = currentData.find(s => s.entity_id.includes('pressure'))?.state;
  
  const currentCondition = getWeatherCondition(
    parseFloat(temp),
    parseFloat(humidity),
    parseFloat(pressure)
  );
  
  const prediction = getPressureTrend(pressureHistory);

  if (!currentCondition) return null;

  return (
    <ConditionsContainer>
      <Condition>
        Trenutni uslovi: {currentCondition}
      </Condition>
      {prediction && (
        <Prediction trend={prediction.trend}>
          {prediction.message}
        </Prediction>
      )}
    </ConditionsContainer>
  );
};

export default WeatherConditions; 