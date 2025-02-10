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
      "unit_of_measurement": "unit"
    },
    "last_updated": "2024-01-01T12:00:00+00:00"
  }
]
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