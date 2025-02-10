export const sensorNames = {
  'sensor.ws2900_v2_02_03_outdoor_temperature': 'Outside Temperature',
  'sensor.ws2900_v2_02_03_relative_pressure': 'Atmospheric Pressure'
};

// Optional: additional sensor-specific configurations
export const sensorConfig = {
  'sensor.ws2900_v2_02_03_outdoor_temperature': {
    name: 'Spoljna temperatura',
    icon: '🌡️',
    precision: 1  // number of decimal places
  },
  'sensor.ws2900_v2_02_03_relative_pressure': {
    name: 'Atmosferski pritisak',
    icon: '🌪️',
    precision: 0
  }
}; 