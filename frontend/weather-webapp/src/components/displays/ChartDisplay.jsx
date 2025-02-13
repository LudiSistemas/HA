import React from 'react';
import styled from 'styled-components';
import WeatherChart from '../charts/WeatherChart';

const ChartContainer = styled.div`
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  margin: 1rem;
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
      <h3>{config.display}</h3>
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