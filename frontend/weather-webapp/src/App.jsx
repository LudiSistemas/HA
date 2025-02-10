import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import WeatherDisplay from './components/WeatherDisplay';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Roboto Mono', monospace;
  }

  body {
    background: #1a1a2e;
    color: #fff;
  }
`;

const LoadingScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5em;
  color: #0ff;
`;

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/sensors');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Get the raw text first
      const text = await response.text();
      console.log('Raw response:', text);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Try to parse the text as JSON
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON Parse error:', parseError);
        throw new Error('Invalid JSON response from server');
      }
      
      console.log('Parsed data:', result);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <>
        <GlobalStyle />
        <LoadingScreen>Loading weather data...</LoadingScreen>
      </>
    );
  }

  return (
    <>
      <GlobalStyle />
      <WeatherDisplay data={data} error={error} />
    </>
  );
}

export default App; 