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

const DetailedPrediction = styled.div`
  margin-top: 10px;
  padding: 10px;
  border-top: 1px solid #0ff3;
  font-size: 0.9em;
`;

const PredictionItem = styled.div`
  color: ${props => props.severity === 'high' ? '#ff4d4d' : 
    props.severity === 'medium' ? '#ffff4d' : '#4dff4d'};
  margin: 5px 0;
`;

const getWeatherCondition = (temp, humidity, pressure, windSpeed, windGust, rain) => {
  if (!temp || !humidity || !pressure) return null;

  let conditions = [];
  
  // Temperature based conditions
  if (temp <= 0) conditions.push('❄️ Hladno');
  else if (temp <= 10) conditions.push('🌡️ Sveže');
  else if (temp <= 20) conditions.push('🌡️ Prijatno');
  else if (temp <= 30) conditions.push('🌡️ Toplo');
  else conditions.push('🌡️ Veoma toplo');
  
  // Humidity based conditions
  if (humidity > 85) conditions.push('💧 Veoma vlažno');
  else if (humidity > 70) conditions.push('💧 Vlažno');
  else if (humidity < 30) conditions.push('🏜️ Suvo');
  
  // Wind conditions
  if (windSpeed > 10) {
    conditions.push('💨 Vetrovito');
    if (windGust > windSpeed * 1.5) {
      conditions.push('🌪️ Jaki udari vetra');
    }
  }

  // Rain conditions
  if (rain > 0) {
    if (rain < 2.5) conditions.push('🌦️ Slaba kiša');
    else if (rain < 7.5) conditions.push('🌧️ Umerena kiša');
    else conditions.push('⛈️ Jaka kiša');
  }
  
  return conditions.join(' • ') || '🌥️ Umereno';
};

const getPressureTrend = (pressureHistory) => {
  if (!pressureHistory?.history || pressureHistory.history.length < 2) return null;

  const recent = pressureHistory.history.slice(-12); // Last 12 readings
  const pressureChange = recent[recent.length - 1].state - recent[0].state;
  const changeRate = pressureChange / (recent.length - 1); // Change per reading
  
  const predictions = [];
  
  // Rapid pressure changes
  if (Math.abs(changeRate) > 0.5) {
    if (changeRate > 0) {
      predictions.push({
        message: '🌤️ Brzi rast pritiska - očekuje se značajno poboljšanje vremena',
        severity: 'low',
        priority: 1
      });
    } else {
      predictions.push({
        message: '🌧️ Brzi pad pritiska - moguće nevreme',
        severity: 'high',
        priority: 1
      });
    }
  }
  
  // Pressure thresholds
  const currentPressure = parseFloat(recent[recent.length - 1].state);
  if (currentPressure < 1000) {
    predictions.push({
      message: '🌧️ Nizak pritisak - povećana verovatnoća padavina',
      severity: 'medium',
      priority: 2
    });
  } else if (currentPressure > 1020) {
    predictions.push({
      message: '☀️ Visok pritisak - stabilno vreme',
      severity: 'low',
      priority: 2
    });
  }

  return predictions.sort((a, b) => a.priority - b.priority);
};

const getWindPrediction = (windSpeed, windGust, windDir) => {
  if (!windSpeed) return null;

  const predictions = [];
  const speed = parseFloat(windSpeed);
  const gust = parseFloat(windGust);
  
  // Beaufort scale based predictions
  if (speed > 10) {
    predictions.push({
      message: '💨 Jak vetar može uticati na aktivnosti na otvorenom',
      severity: 'medium',
      priority: 1
    });
  }
  
  if (gust > 15) {
    predictions.push({
      message: '🌪️ Mogući jaki udari vetra',
      severity: 'high',
      priority: 1
    });
  }

  return predictions;
};

const WeatherConditions = ({ currentData, pressureHistory }) => {
  const temp = currentData.find(s => s.entity_id.includes('temperature'))?.state;
  const humidity = currentData.find(s => s.entity_id.includes('humidity'))?.state;
  const pressure = currentData.find(s => s.entity_id.includes('pressure'))?.state;
  const windSpeed = currentData.find(s => s.entity_id.includes('wind_speed'))?.state;
  const windGust = currentData.find(s => s.entity_id.includes('wind_gust'))?.state;
  const windDir = currentData.find(s => s.entity_id.includes('wind_direction'))?.state;
  const rain = currentData.find(s => s.entity_id.includes('rain'))?.state;
  
  const currentCondition = getWeatherCondition(
    parseFloat(temp),
    parseFloat(humidity),
    parseFloat(pressure),
    parseFloat(windSpeed),
    parseFloat(windGust),
    parseFloat(rain)
  );
  
  const pressurePredictions = getPressureTrend(pressureHistory);
  const windPredictions = getWindPrediction(windSpeed, windGust, windDir);
  
  const allPredictions = [
    ...(pressurePredictions || []),
    ...(windPredictions || [])
  ].sort((a, b) => a.priority - b.priority);

  if (!currentCondition) return null;

  return (
    <ConditionsContainer>
      <Condition>
        Trenutni uslovi: {currentCondition}
      </Condition>
      <DetailedPrediction>
        {allPredictions.map((pred, index) => (
          <PredictionItem key={index} severity={pred.severity}>
            {pred.message}
          </PredictionItem>
        ))}
      </DetailedPrediction>
    </ConditionsContainer>
  );
};

export default WeatherConditions; 