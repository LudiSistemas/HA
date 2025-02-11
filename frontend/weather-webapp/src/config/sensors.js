export const sensorNames = {
  'sensor.ws2900_v2_02_03_outdoor_temperature': 'Outside Temperature',
  'sensor.ws2900_v2_02_03_relative_pressure': 'Atmospheric Pressure'
};

// Optional: additional sensor-specific configurations
export const sensorConfig = {
  'sensor.ws2900_v2_02_03_outdoor_temperature': {
    name: 'Spoljna temperatura',
    icon: '🌡️',
    precision: 1
  },
  'sensor.ws2900_v2_02_03_relative_pressure': {
    name: 'Atmosferski pritisak',
    icon: '🌪️',
    precision: 0
  },
  'sensor.ws2900_v2_02_03_humidity': {
    name: 'Vlažnost vazduha',
    icon: '💧',
    precision: 0
  },
  'sensor.ws2900_v2_02_03_solar_radiation': {
    name: 'Sunčevo zračenje',
    icon: '☀️',
    precision: 0,
    unit: 'W/m²'
  },
  'sensor.ws2900_v2_02_03_uv_index': {
    name: 'UV indeks',
    icon: '🌞',
    precision: 1,
    getWarning: (value) => {
      const uvValue = parseFloat(value);
      if (uvValue >= 11) return 'Ekstremno! Izbegavajte sunce od 10-16h';
      if (uvValue >= 8) return 'Vrlo visok! Koristite zaštitu';
      if (uvValue >= 6) return 'Visok! Potrebna zaštita';
      if (uvValue >= 3) return 'Umeren. Preporučena zaštita';
      return 'Nizak. Bezbedno';
    }
  },
  'sensor.ws2900_v2_02_03_wind_direction': {
    name: 'Smer vetra',
    icon: '🧭',
    precision: 0,
    type: 'compass'
  },
  'sensor.ws2900_v2_02_03_wind_speed': {
    name: 'Brzina vetra',
    icon: '💨',
    precision: 1
  },
  'sensor.ws2900_v2_02_03_wind_gust': {
    name: 'Udari vetra',
    icon: '💨',
    precision: 1
  }
}; 