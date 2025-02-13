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
  console.log('ChartDisplay received data:', data);
  
  if (!data || !data.history) {
    console.log('No data or history available for ChartDisplay');
    return null;
  }

  return (
    <ChartContainer>
      <h3>{config.display}</h3>
      <WeatherChart 
        data={Array.isArray(data.history) ? data.history : []}
        unit={data.unit || ''}
        precision={config.precision || 1}
        sensorType={data.entity_id?.includes('rain') ? 'rain' : 'default'}
        entityId={data.entity_id}
      />
    </ChartContainer>
  );
};

export default ChartDisplay; 