# Home Assistant Sensor Proxy

A FastAPI-based backend service that securely proxies requests to Home Assistant's REST API. This service can proxy any sensor data from your Home Assistant instance.

## Setup

1. Create a `.env` file in the backend directory with the following variables:

```
HASS_URL=http://homeassistant.local:8123
HASS_TOKEN=your_long_lived_access_token
SENSOR_IDS=sensor.temperature,sensor.humidity
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the server:

```bash
python main.py
```

The server will start on `http://localhost:8000`

## API Endpoints

### GET /api/sensors
Returns the current state of all configured sensors from Home Assistant.

Response format:
```json
[
  {
    "entity_id": "sensor.any_sensor_id",
    "state": "value",
    "attributes": {
      "friendly_name": "Sensor Name",
      "unit_of_measurement": "unit"
    },
    "last_updated": "2024-01-01T12:00:00+00:00"
  }
]
```

## Configuration

- `HASS_URL`: Your Home Assistant instance URL
- `HASS_TOKEN`: Long-lived access token from Home Assistant
- `SENSOR_IDS`: List of any sensor entity IDs you want to monitor
- `CORS_ORIGINS`: Allowed origins for CORS (usually your frontend URL)

## Security Notes

- The backend never exposes the Home Assistant token to the frontend
- All requests to Home Assistant are proxied through this backend
- CORS is configured to only allow specified origins