import React from 'react';
import styled from 'styled-components';
import WeatherChart from '../charts/WeatherChart';

const ChartContainer = styled.div`
  padding: 2rem;
  background: rgba(44, 46, 64, 0.7);
  border-radius: 15px;
  margin: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
`;

const Title = styled.h3`
  font-family: 'Georgia', serif;
  color: white;
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  font-weight: normal;
  text-align: center;
`;

const ChartDisplay = ({ data, config }) => {
  console.log('ChartDisplay received data:', {
    entity_id: data.entity_id,
    state: data.state,
    history: data.history,
    config
  });
  
  if (!data || !data.history) {
    console.log('No data or history available for ChartDisplay');
    return null;
  }

  // Extract the history array from the history object
  const historyArray = data.history.history || [];
  console.log('History array length:', historyArray.length);

  return (
    <ChartContainer>
      <Title>{config.display}</Title>
      <WeatherChart 
        data={historyArray}
        unit={data.attributes?.unit_of_measurement || ''}
        precision={config.precision || 1}
        sensorType={data.entity_id?.includes('rain') ? 'rain' : 'default'}
        entityId={data.entity_id}
      />
    </ChartContainer>
  );
};

export default ChartDisplay; 