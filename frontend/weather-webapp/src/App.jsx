import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import WeatherDisplay from './components/WeatherDisplay';
import { LanguageProvider } from './contexts/LanguageContext';

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

  // Get the base URL from environment variables
  const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/sensors`;
  console.log('Using API URL:', API_URL);

  const fetchData = async () => {
    try {
      console.log('Fetching from:', API_URL);
      const response = await fetch(API_URL, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log('Raw response:', text);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      try {
        const result = JSON.parse(text);
        console.log('Parsed data:', result);
        setData(result);
        setError(null);
      } catch (parseError) {
        console.error('JSON Parse error:', parseError);
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
      }
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
    <LanguageProvider>
      <GlobalStyle />
      <WeatherDisplay data={data} error={error} />
    </LanguageProvider>
  );
}

export default App; 