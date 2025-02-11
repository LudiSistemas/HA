export const translations = {
  en: {
    conditions: {
      cold: 'Cold',
      hot: 'Hot',
      pleasant: 'Pleasant',
      humid: 'Humid',
      veryHumid: 'Very humid',
      dry: 'Dry',
      windy: 'Windy',
      strongGusts: 'Strong wind gusts',
      possibleSnow: 'Snow possible',
      highSnowChance: 'High chance of snow',
      muggy: 'Muggy'
    },
    warnings: {
      uvExtreme: '🌞 EXTREME UV radiation! Avoid sun between 10-16h',
      uvVeryHigh: '🌞 Very high UV index! Use protection and avoid sun between 11-15h',
      uvHigh: '🌞 High UV index! Sun protection needed',
      heatWave: '🌡️ WARNING: Extremely high temperatures! Avoid exertion and direct sun',
      heatIndex: '🌡️ Dangerous heat index! Heat stroke possible',
      pressureDrop: '🌧️ Rapid pressure drop - possible storm',
      pressureRise: '🌤️ Rapid pressure rise - weather improvement expected',
      // ... add all other warnings
    },
    pressure: {
      rising: {
        rapid: '🌤️ Rapid pressure rise - weather stabilization expected',
        steady: '🌥️ Steady pressure rise over last 3 hours',
        long: '☀️ Long-term pressure rise - weather stabilization'
      },
      falling: {
        rapid: '🌧️ Rapid pressure drop - possible weather deterioration',
        steady: '🌦️ Steady pressure drop over last 3 hours',
        long: '🌧️ Long-term pressure drop - storm system developing'
      },
      levels: {
        high: '☀️ High pressure - stable weather',
        low: '🌧️ Low pressure - increased chance of precipitation'
      }
    },
    stats: {
      totalVisits: 'Total visits',
      uniqueVisitors: 'Unique visitors',
      last24h: 'Visits in last 24h'
    },
    headers: {
      forecast: 'Forecast',
      warnings: 'Warnings',
      currentConditions: 'Current conditions'
    }
  },
  sr: {
    conditions: {
      cold: 'Hladno',
      hot: 'Toplo',
      pleasant: 'Prijatno',
      humid: 'Vlažno',
      veryHumid: 'Veoma vlažno',
      dry: 'Suvo',
      windy: 'Vetrovito',
      strongGusts: 'Jaki udari vetra',
      possibleSnow: 'Moguć sneg',
      highSnowChance: 'Veliki izgledi za sneg',
      muggy: 'Sparno'
    },
    warnings: {
      uvExtreme: '🌞 EKSTREMNO UV zračenje! Obavezno izbegavati sunce od 10-16h',
      uvVeryHigh: '🌞 Vrlo visok UV indeks! Koristiti zaštitu i izbegavati sunce od 11-15h',
      uvHigh: '🌞 Visok UV indeks! Potrebna zaštita od sunca',
      heatWave: '🌡️ UPOZORENJE: Ekstremno visoke temperature! Izbegavati napor i direktno sunce',
      heatIndex: '🌡️ Opasno visok osećaj temperature! Moguć toplotni udar',
      pressureDrop: '🌧️ Brzi pad pritiska - moguće nevreme',
      pressureRise: '🌤️ Brzi rast pritiska - očekuje se značajno poboljšanje vremena',
      // ... keep all existing Serbian warnings
    },
    stats: {
      totalVisits: 'Ukupno poseta',
      uniqueVisitors: 'Jedinstvenih posetilaca',
      last24h: 'Poseta u zadnja 24h'
    },
    headers: {
      forecast: 'Prognoza',
      warnings: 'Upozorenja',
      currentConditions: 'Trenutni uslovi'
    }
  }
}; 