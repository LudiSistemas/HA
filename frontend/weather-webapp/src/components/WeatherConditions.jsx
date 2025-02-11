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

const SEASONS = {
  WINTER: { start: '12-01', end: '02-28', name: 'zima' },
  SPRING: { start: '03-01', end: '05-31', name: 'proleće' },
  SUMMER: { start: '06-01', end: '08-31', name: 'leto' },
  AUTUMN: { start: '09-01', end: '11-30', name: 'jesen' }
};

// Seasonal norms for Niš (42°52'N 21°32'E)
const SEASONAL_NORMS = {
  WINTER: {
    temp: { min: -2, max: 8 },
    pressure: { normal: 1018 },
    humidity: { normal: 80 },
    description: 'hladno sa mogućim snegom'
  },
  SPRING: {
    temp: { min: 8, max: 22 },
    pressure: { normal: 1015 },
    humidity: { normal: 65 },
    description: 'promenljivo sa kišom'
  },
  SUMMER: {
    temp: { min: 15, max: 32 },
    pressure: { normal: 1013 },
    humidity: { normal: 55 },
    description: 'toplo i suvo'
  },
  AUTUMN: {
    temp: { min: 5, max: 20 },
    pressure: { normal: 1016 },
    humidity: { normal: 70 },
    description: 'umereno sa kišom'
  }
};

// Add day/night variations
const DAY_NIGHT_NORMS = {
  DAY: {
    WINTER: { temp: { min: 0, max: 8 }, humidity: { min: 65, max: 85 } },
    SPRING: { temp: { min: 12, max: 22 }, humidity: { min: 55, max: 75 } },
    SUMMER: { temp: { min: 20, max: 32 }, humidity: { min: 45, max: 65 } },
    AUTUMN: { temp: { min: 10, max: 20 }, humidity: { min: 60, max: 80 } }
  },
  EVENING: {
    WINTER: { temp: { min: -1, max: 5 }, humidity: { min: 70, max: 88 } },
    SPRING: { temp: { min: 10, max: 18 }, humidity: { min: 60, max: 80 } },
    SUMMER: { temp: { min: 18, max: 28 }, humidity: { min: 50, max: 70 } },
    AUTUMN: { temp: { min: 8, max: 17 }, humidity: { min: 65, max: 83 } }
  },
  NIGHT: {
    WINTER: { temp: { min: -2, max: 4 }, humidity: { min: 75, max: 90 } },
    SPRING: { temp: { min: 8, max: 15 }, humidity: { min: 65, max: 85 } },
    SUMMER: { temp: { min: 15, max: 25 }, humidity: { min: 55, max: 75 } },
    AUTUMN: { temp: { min: 5, max: 15 }, humidity: { min: 70, max: 85 } }
  }
};

const getCurrentSeason = () => {
  const now = new Date();
  const monthDay = now.toLocaleString('en-US', { month: '2-digit', day: '2-digit' });
  
  for (const [season, { start, end }] of Object.entries(SEASONS)) {
    if (monthDay >= start && monthDay <= end) {
      return season;
    }
  }
  return 'WINTER'; // Default for edge cases
};

const getSunriseSunset = () => {
  // Approximate sunrise/sunset times for Niš based on season
  const now = new Date();
  const month = now.getMonth();
  
  // Times are adjusted for Niš's location
  if (month >= 11 || month <= 1) { // Winter
    return { sunrise: '07:00', sunset: '16:00' };
  } else if (month >= 2 && month <= 4) { // Spring
    return { sunrise: '05:30', sunset: '19:00' };
  } else if (month >= 5 && month <= 7) { // Summer
    return { sunrise: '05:00', sunset: '20:30' };
  } else { // Autumn
    return { sunrise: '06:00', sunset: '17:30' };
  }
};

const getTimeCategory = () => {
  const hours = new Date().getHours();
  if (hours >= 18 && hours < 22) return 'EVENING';
  if (hours >= 7 && hours < 18) return 'DAY';
  return 'NIGHT';
};

const isDaytime = () => {
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
  const { sunrise, sunset } = getSunriseSunset();
  return currentTime >= sunrise && currentTime <= sunset;
};

const getTimeOfDay = () => {
  const now = new Date();
  const hours = now.getHours();
  
  if (hours >= 22 || hours < 4) return 'noć';
  if (hours >= 4 && hours < 7) return 'rano jutro';
  if (hours >= 7 && hours < 11) return 'jutro';
  if (hours >= 11 && hours < 14) return 'podne';
  if (hours >= 14 && hours < 18) return 'poslepodne';
  if (hours >= 18 && hours < 22) return 'veče';
  return 'noć';
};

const getSeasonalPrediction = (temp, humidity, pressure, season) => {
  const predictions = [];
  const timeOfDay = getTimeOfDay();
  const timeCategory = getTimeCategory();
  const timeNorms = DAY_NIGHT_NORMS[timeCategory][season];

  // Temperature anomalies for time of day
  const tempDiff = temp - (timeNorms.temp.max + timeNorms.temp.min) / 2;
  if (Math.abs(tempDiff) > 3) {
    predictions.push({
      message: tempDiff > 0 
        ? `🌡️ Temperatura je ${tempDiff.toFixed(1)}°C iznad proseka za ${timeOfDay}`
        : `❄️ Temperatura je ${Math.abs(tempDiff).toFixed(1)}°C ispod proseka za ${timeOfDay}`,
      severity: Math.abs(tempDiff) > 5 ? 'high' : 'medium',
      priority: 2
    });
  }

  // Night-specific predictions
  if (!isDaytime()) {
    const tempDrop = temp - timeNorms.temp.max;
    if (tempDrop < -8) {
      predictions.push({
        message: '❄️ Značajan noćni pad temperature',
        severity: 'medium',
        priority: 2
      });
    }
    
    if (humidity > timeNorms.humidity.max) {
      predictions.push({
        message: '💧 Povećana vlažnost tokom noći - moguća rosa ili magla',
        severity: 'low',
        priority: 3
      });
    }
  }

  // Day-specific predictions
  if (isDaytime() && season === 'SUMMER' && temp > timeNorms.temp.max) {
    predictions.push({
      message: '☀️ Visoke dnevne temperature - preporučuje se izbegavanje sunca',
      severity: 'high',
      priority: 1
    });
  }

  return predictions;
};

const isSnowLikely = (temp, humidity, pressure, pressureTrend) => {
  // Basic conditions that must be met
  const basicConditions = temp <= 0 && humidity > 80;
  if (!basicConditions) return false;

  // Pressure conditions favorable for snow
  const pressureConditions = pressure < 1015 && pressure > 995;
  if (!pressureConditions) return false;

  // Check pressure trend (falling pressure often indicates precipitation)
  const pressureIsFalling = pressureTrend < 0;

  // Calculate probability based on conditions
  let probability = 0;
  
  // Temperature factors
  if (temp <= -2) probability += 0.3;
  else if (temp <= -1) probability += 0.2;
  else probability += 0.1;

  // Humidity factors
  if (humidity > 90) probability += 0.3;
  else if (humidity > 85) probability += 0.2;
  else probability += 0.1;

  // Pressure factors
  if (pressureIsFalling && pressure < 1010) probability += 0.3;
  else if (pressureIsFalling) probability += 0.2;

  return probability > 0.5;
};

const getWeatherCondition = (temp, humidity, pressure, windSpeed, windGust, rain, season, pressureHistory) => {
  if (!temp || !humidity || !pressure) return null;

  const norms = SEASONAL_NORMS[season];
  const timeOfDay = getTimeOfDay();
  const timeCategory = getTimeCategory();
  const timeNorms = DAY_NIGHT_NORMS[timeCategory][season];
  let conditions = [];
  
  // Time of day indicator
  conditions.push(isDaytime() ? '☀️' : '🌙');
  
  // Temperature conditions with day/night context
  if (temp < timeNorms.temp.min) {
    conditions.push(`❄️ Hladno za ${timeOfDay}`);
  } else if (temp > timeNorms.temp.max) {
    conditions.push(`🌡️ Toplo za ${timeOfDay}`);
  } else {
    conditions.push('🌡️ Prijatno');
  }
  
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
  
  // Enhanced snow prediction
  if (season === 'WINTER') {
    const pressureTrend = pressureHistory?.history 
      ? pressureHistory.history[pressureHistory.history.length - 1].state - pressureHistory.history[0].state
      : 0;

    if (isSnowLikely(temp, humidity, pressure, pressureTrend)) {
      conditions.push('🌨️ Veliki izgledi za sneg');
    } else if (temp <= 0 && humidity > 80 && pressure < 1015) {
      conditions.push('🌨️ Moguć sneg');
    }
  }
  
  if (season === 'SUMMER' && temp > 30 && humidity > 60) {
    conditions.push('🌡️ Sparno');
  }

  return conditions.join(' • ');
};

const getPressureTrend = (pressureHistory, currentData) => {
  if (!pressureHistory?.history || pressureHistory.history.length < 2) return null;

  const recent = pressureHistory.history.slice(-12);
  const pressureChange = recent[recent.length - 1].state - recent[0].state;
  const changeRate = pressureChange / (recent.length - 1);
  const currentPressure = parseFloat(recent[recent.length - 1].state);
  
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

  // Enhanced snow prediction in pressure analysis
  const currentSeason = getCurrentSeason();
  if (currentSeason === 'WINTER' && currentData) {
    const temp = parseFloat(currentData.find(s => s.entity_id.includes('temperature'))?.state);
    const humidity = parseFloat(currentData.find(s => s.entity_id.includes('humidity'))?.state);
    
    if (isSnowLikely(temp, humidity, currentPressure, pressureChange)) {
      predictions.push({
        message: '🌨️ Visoka verovatnoća snežnih padavina',
        severity: 'high',
        priority: 1
      });
    } else if (temp <= 0 && humidity > 80 && currentPressure < 1015 && pressureChange < 0) {
      predictions.push({
        message: '🌨️ Postoje uslovi za snežne padavine',
        severity: 'medium',
        priority: 2
      });
    }
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

const Header = styled.div`
  color: #0ff;
  font-size: 1.3em;
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
  border-bottom: 1px solid #0ff3;
  padding-bottom: 10px;
`;

const WarningHeader = styled.div`
  color: #ff4d4d;
  font-size: 1.1em;
  margin-top: 20px;
  margin-bottom: 10px;
  text-align: center;
`;

const WeatherConditions = ({ currentData, pressureHistory }) => {
  const currentSeason = getCurrentSeason();
  
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
    parseFloat(rain),
    currentSeason,
    pressureHistory
  );
  
  const pressurePredictions = getPressureTrend(pressureHistory, currentData);
  const windPredictions = getWindPrediction(windSpeed, windGust, windDir);
  
  const seasonalPredictions = getSeasonalPrediction(
    parseFloat(temp),
    parseFloat(humidity),
    parseFloat(pressure),
    currentSeason
  );

  const allPredictions = [
    ...(pressurePredictions || []),
    ...(windPredictions || []),
    ...(seasonalPredictions || [])
  ].sort((a, b) => a.priority - b.priority);

  if (!currentCondition) return null;

  return (
    <ConditionsContainer>
      <Header>Prognoza</Header>
      <Condition>
        Trenutni uslovi: {currentCondition}
      </Condition>
      {allPredictions.length > 0 && (
        <>
          <WarningHeader>Upozorenja</WarningHeader>
          <DetailedPrediction>
            {allPredictions.map((pred, index) => (
              <PredictionItem key={index} severity={pred.severity}>
                {pred.message}
              </PredictionItem>
            ))}
          </DetailedPrediction>
        </>
      )}
    </ConditionsContainer>
  );
};

export default WeatherConditions; 