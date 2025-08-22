# Home Assistant Sensor Proxy

A FastAPI-based backend service that securely proxies requests to Home Assistant's REST API. This service can proxy any sensor data from your Home Assistant instance.

## Features

- Secure proxy for Home Assistant sensor data
- Rate limiting with slowapi
- Production-ready Nginx configuration with Cloudflare support
- Environment-based configuration (development/production)
- Comprehensive logging
- CORS protection
- OpenAPI documentation (Swagger UI)

## Setup

1. Create a `.env` file in the backend directory by copying `.env.example`:

```bash
cp .env.example .env
```

Then configure the following variables:

```
HASS_URL=http://homeassistant.local:8123
HASS_TOKEN=your_long_lived_access_token
SENSOR_IDS=["sensor.temperature", "sensor.humidity"]
ENVIRONMENT=development  # or production
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

## Environment Configuration

The application supports two environments:

- `development` (default)
  - Enables hot reloading
  - More verbose logging
  - API documentation available

- `production`
  - Disables hot reloading
  - Should be run behind Nginx
  - Recommended to use with systemd or similar process manager

## API Endpoints

### GET /api/ping
Simple health check endpoint to verify API is running.

### GET /api/config
Returns current configuration (excluding sensitive data).

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
      "unit_of_measurement": "unit",
      "formatted_value": "human_readable_value"
    },
    "last_updated": "2024-01-01T12:00:00+00:00"
  }
]
```

**Lightning Sensors Special Handling:**
- `sensor.home_lightning_azimuth`: Shows degrees (0-360°) or "No strikes" if null
- `sensor.home_lightning_counter`: Always shows number of detected strikes (≥0)
- `sensor.home_lightning_distance`: Shows distance in km or "No strikes" if null

### GET /api/user-location
Returns user's country based on IP address.

### GET /api/lightning-history
Returns historical lightning data for specified time period.

**Parameters:**
- `hours` (optional): Number of hours to look back (1-168, default: 24)
- `sensor_type` (optional): Filter by sensor type - "all", "azimuth", "distance", or "counter" (default: "all")

**Example:**
```
GET /api/lightning-history?hours=48&sensor_type=azimuth
```

**Response format:**
```json
{
  "status": "success",
  "period": {
    "start": "2025-08-20T22:32:12.039639",
    "end": "2025-08-22T22:32:12.039639",
    "hours": 48
  },
  "sensor_type": "azimuth",
  "data": {
    "azimuth": {
      "sensor_id": "sensor.home_lightning_azimuth",
      "total_events": 5,
      "history": [
        {
          "timestamp": "2025-08-21T14:30:00+00:00",
          "value": 45.0,
          "formatted": "45.0°"
        }
      ],
      "last_event": {...}
    }
  },
  "summary": {
    "total_sensors": 1,
    "total_strikes_detected": 5,
    "has_recent_activity": false,
    "last_update": "2025-08-22T22:32:12.039639"
  }
}
```

### GET /api/lightning-status
Returns current lightning detection status and statistics.

Response format:
```json
{
  "status": "active|inactive",
  "timestamp": "2024-01-01T12:00:00+00:00",
  "data": {
    "azimuth": {
      "value": "45.0",
      "unit": "degrees",
      "has_strikes": true
    },
    "distance": {
      "value": "12.5",
      "unit": "kilometers",
      "has_strikes": true
    },
    "counter": {
      "value": "15",
      "unit": "strikes",
      "total_strikes": 15
    }
  },
  "summary": {
    "has_lightning": true,
    "sensor_count": 3,
    "last_update": "2024-01-01T12:00:00+00:00"
  }
}
```

## Configuration Files

- `.env`: Main configuration file (see `.env.example` for template)
- `nginx/config.example`: Example Nginx configuration with Cloudflare support
- `requirements.txt`: Python dependencies

## Security Features

- Rate limiting (60 requests per minute per IP)
- Cloudflare IP filtering in Nginx
- CORS protection
- Proxy-only access to Home Assistant
- No exposure of sensitive tokens to frontend
- Request logging with real IP detection behind proxy

## Production Deployment

1. Set `ENVIRONMENT=production` in `.env`
2. Configure Nginx using the provided example in `nginx/config.example`
3. Set up SSL with Cloudflare
4. Configure systemd or similar for process management
5. Ensure proper file permissions and security measures

## Development

API documentation is available at:
- Swagger UI: `/api/docs`
- ReDoc: `/api/redoc`
- OpenAPI JSON: `/api/openapi.json`

## Requirements

- Python 3.8+
- FastAPI
- uvicorn
- httpx
- pydantic
- slowapi
- Additional dependencies in `requirements.txt`