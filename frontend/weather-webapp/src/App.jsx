import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import WeatherDisplay from './components/WeatherDisplay';
import ErrorBoundary from './components/ErrorBoundary';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body, html {
    background: #1a1b26;
    min-height: 100vh;
    width: 100%;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  #root {
    background: #1a1b26;
    min-height: 100vh;
    width: 100%;
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  background: #1a1b26;
  color: white;
  padding: 20px;
`;

const App = () => {
  const [sensorData, setSensorData] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/sensors`);
        if (!response.ok) throw new Error('Failed to fetch sensor data');
        const data = await response.json();
        
        // Transform array into object keyed by entity_id
        const transformedData = data.reduce((acc, sensor) => {
          acc[sensor.entity_id] = {
            ...sensor,
            entity_id: sensor.entity_id,
            state: sensor.state,
            attributes: sensor.attributes,
            last_updated: sensor.last_updated
          };
          return acc;
        }, {});
        
        console.log('Transformed sensor data:', transformedData);
        setSensorData(transformedData);
      } catch (err) {
        console.error('Error fetching sensor data:', err);
        setError(err.message);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <ErrorBoundary>
          <WeatherDisplay data={sensorData} error={error} />
        </ErrorBoundary>
      </AppContainer>
    </>
  );
};

export default App; 