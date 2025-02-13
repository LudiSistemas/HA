import React from 'react';
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
  margin-bottom: 2rem;
  font-weight: 500;
  text-align: center;

  @media (min-width: 1400px) {
    font-size: 3rem;
    margin-bottom: 2.5rem;
  }
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