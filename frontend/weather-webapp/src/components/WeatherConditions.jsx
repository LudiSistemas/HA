import React, { useContext } from 'react';
import styled from 'styled-components';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../config/translations';

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

  // Pressure conditions favorable for snow (using sea level pressure)
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

  // Pressure factors (using sea level pressure)
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
  
  // Pressure based conditions
  if (pressure >= 1020) {
    conditions.push('🌤️ Stabilan vazdušni pritisak');
  } else if (pressure <= 1000) {
    conditions.push('🌧️ Nizak vazdušni pritisak');
  }
  
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
  
  return conditions.join(' • ');
};

const analyzePressurePeriods = (history) => {
  if (!history || history.length < 2) return null;

  // Get timestamps for different periods
  const now = new Date();
  const oneHourAgo = new Date(now - 3600000);
  const threeHoursAgo = new Date(now - 10800000);
  const sixHoursAgo = new Date(now - 21600000);

  // Get pressure values for each period
  const currentPressure = parseFloat(history[history.length - 1].state);
  
  const oneHourData = history.find(item => new Date(item.last_updated) >= oneHourAgo);
  const threeHourData = history.find(item => new Date(item.last_updated) >= threeHoursAgo);
  const sixHourData = history.find(item => new Date(item.last_updated) >= sixHoursAgo);

  // Calculate changes
  const changes = {
    oneHour: oneHourData ? currentPressure - parseFloat(oneHourData.state) : null,
    threeHour: threeHourData ? currentPressure - parseFloat(threeHourData.state) : null,
    sixHour: sixHourData ? currentPressure - parseFloat(sixHourData.state) : null
  };

  return {
    current: currentPressure,
    changes,
    trend: getTrendDescription(changes)
  };
};

const getTrendDescription = (changes) => {
  const { oneHour, threeHour, sixHour } = changes;
  
  // Significant pressure changes (hPa per hour)
  const RAPID_CHANGE = 0.5;  // > 0.5 hPa/h is considered rapid
  const MODERATE_CHANGE = 0.2;  // > 0.2 hPa/h is considered moderate

  let trend = [];

  // Analyze one hour change
  if (oneHour !== null) {
    const hourlyRate = oneHour;
    if (Math.abs(hourlyRate) >= RAPID_CHANGE) {
      trend.push({
        message: hourlyRate > 0
          ? '🌤️ Nagli rast pritiska u poslednjem satu - brzo poboljšanje vremena'
          : '🌧️ Nagli pad pritiska u poslednjem satu - moguće brzo pogoršanje',
        severity: hourlyRate > 0 ? 'low' : 'high',
        priority: 1
      });
    }
  }

  // Analyze three hour trend
  if (threeHour !== null) {
    const threeHourRate = threeHour / 3;
    if (Math.abs(threeHourRate) >= MODERATE_CHANGE) {
      trend.push({
        message: threeHourRate > 0
          ? '🌥️ Postojan rast pritiska u poslednja 3 sata'
          : '🌦️ Postojan pad pritiska u poslednja 3 sata',
        severity: threeHourRate > 0 ? 'low' : 'medium',
        priority: 2
      });
    }
  }

  // Analyze six hour trend
  if (sixHour !== null) {
    const sixHourRate = sixHour / 6;
    if (Math.abs(sixHourRate) >= MODERATE_CHANGE) {
      trend.push({
        message: sixHourRate > 0
          ? '☀️ Dugotrajan rast pritiska - stabilizacija vremena'
          : '🌧️ Dugotrajan pad pritiska - razvoj vremenske nepogode',
        severity: sixHourRate > 0 ? 'low' : 'high',
        priority: sixHourRate > 0 ? 3 : 1
      });
    }
  }

  return trend;
};

// Update getPressureTrend function to use the new analysis
const getPressureTrend = (pressureHistory, currentData) => {
  if (!pressureHistory?.history || pressureHistory.history.length < 2) return null;

  const analysis = analyzePressurePeriods(pressureHistory.history);
  if (!analysis) return null;

  const predictions = [...analysis.trend];
  
  // Add existing pressure level warnings
  if (analysis.current < 1000) {
    predictions.push({
      message: '🌧️ Nizak pritisak - povećana verovatnoća padavina',
      severity: 'medium',
      priority: 2
    });
  } else if (analysis.current > 1020) {
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

const getUVPrediction = (uvIndex) => {
  if (!uvIndex) return null;
  
  const uv = parseFloat(uvIndex);
  const predictions = [];

  if (uv >= 11) {
    predictions.push({
      message: '🌞 EKSTREMNO UV zračenje! Obavezno izbegavati sunce od 10-16h',
      severity: 'high',
      priority: 1
    });
  } else if (uv >= 8) {
    predictions.push({
      message: '🌞 Vrlo visok UV indeks! Koristiti zaštitu i izbegavati sunce od 11-15h',
      severity: 'high',
      priority: 1
    });
  } else if (uv >= 6) {
    predictions.push({
      message: '🌞 Visok UV indeks! Potrebna zaštita od sunca',
      severity: 'medium',
      priority: 2
    });
  }

  return predictions;
};

const getHeatWavePrediction = (temp, humidity, season) => {
  if (!temp || !humidity) return null;
  
  const predictions = [];
  const heatIndex = calculateHeatIndex(temp, humidity);

  // Toplotni talas - više uzastopnih dana sa visokom temperaturom
  if (season === 'SUMMER' && temp >= 35) {
    predictions.push({
      message: '🌡️ UPOZORENJE: Ekstremno visoke temperature! Izbegavati napor i direktno sunce',
      severity: 'high',
      priority: 1
    });
  } else if (season === 'SUMMER' && temp >= 32) {
    predictions.push({
      message: '🌡️ Toplotni talas - preporučuje se izbegavanje fizičkih aktivnosti',
      severity: 'high',
      priority: 1
    });
  }

  // Osećaj temperature (heat index)
  if (heatIndex > 40) {
    predictions.push({
      message: '🌡️ Opasno visok osećaj temperature! Moguć toplotni udar',
      severity: 'high',
      priority: 1
    });
  } else if (heatIndex > 35) {
    predictions.push({
      message: '🌡️ Povišen osećaj temperature - potreban oprez',
      severity: 'medium',
      priority: 2
    });
  }

  return predictions;
};

// Pomoćna funkcija za računanje heat index-a
const calculateHeatIndex = (temp, humidity) => {
  // Pojednostavljena formula za heat index
  if (temp < 27) return temp;
  
  const t = temp;
  const h = humidity;
  
  return -8.784695 + 1.61139411 * t + 2.338549 * h - 0.14611605 * t * h - 
         0.012308094 * t * t - 0.016424828 * h * h + 0.002211732 * t * t * h +
         0.00072546 * t * h * h - 0.000003582 * t * t * h * h;
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
  const { language } = useContext(LanguageContext);
  const t = translations[language];

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

  const uvIndex = currentData.find(s => s.entity_id.includes('uv_index'))?.state;
  
  const uvPredictions = getUVPrediction(uvIndex);
  const heatPredictions = getHeatWavePrediction(
    parseFloat(temp),
    parseFloat(humidity),
    currentSeason
  );

  const allPredictions = [
    ...(pressurePredictions || []),
    ...(windPredictions || []),
    ...(seasonalPredictions || []),
    ...(uvPredictions || []),
    ...(heatPredictions || [])
  ].sort((a, b) => a.priority - b.priority);

  if (!currentCondition) return null;

  return (
    <ConditionsContainer>
      <Header>{t.headers.forecast}</Header>
      <Condition>
        {t.headers.currentConditions}: {currentCondition}
      </Condition>
      {allPredictions.length > 0 && (
        <>
          <WarningHeader>{t.headers.warnings}</WarningHeader>
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