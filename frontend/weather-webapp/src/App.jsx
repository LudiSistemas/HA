import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import WeatherDisplay from './components/WeatherDisplay';
import ErrorBoundary from './components/displays/ErrorBoundary';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #1a1b26;
  color: white;
  padding: 20px;
`;

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/sensors`);
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <AppContainer>
      <ErrorBoundary>
        <WeatherDisplay data={data} error={error} />
      </ErrorBoundary>
    </AppContainer>
  );
}

export default App; 