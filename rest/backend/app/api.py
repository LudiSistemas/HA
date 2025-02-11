from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional, Literal
import httpx
from pydantic import BaseModel, Field
from app.config import settings
from datetime import datetime, timedelta

# Create router with prefix to match nginx location
router = APIRouter(prefix="/api", tags=["sensors"])

# Debug route to check if API is accessible
@router.get("/ping")
async def ping():
    """Simple endpoint to verify API is working"""
    return {"status": "ok", "message": "API is running"}

# Debug route to see what sensors are configured
@router.get("/config", tags=["system"])
async def get_config():
    """Returns current configuration (excluding sensitive data)"""
    # Convert string to list if needed (handles both formats)
    sensors = settings.SENSOR_IDS
    if isinstance(sensors, str):
        # Handle comma-separated string format
        sensors = [s.strip() for s in sensors.split(',')]
    
    return {
        "sensors": sensors,
        "hass_url": settings.HASS_URL.replace("http://192.168.", "http://homeassistant.")  # Sanitize internal URL
    }

class SensorAttributes(BaseModel):
    unit_of_measurement: str
    friendly_name: str
    state_class: str = "measurement"
    device_class: Optional[str] = None

class SensorData(BaseModel):
    entity_id: str
    state: str
    attributes: SensorAttributes
    last_updated: str
    
    @property
    def sensor_type(self) -> str:
        if "temperature" in self.entity_id:
            return "temperature"
        elif "humidity" in self.entity_id:
            return "humidity"
        elif "pressure" in self.entity_id:
            return "pressure"
        elif "wind" in self.entity_id:
            return "wind"
        elif "uv" in self.entity_id:
            return "uv"
        elif "solar" in self.entity_id:
            return "solar"
        return "unknown"
    
    def validate_state(self) -> bool:
        """Validates state based on sensor type"""
        try:
            value = float(self.state)
            if self.sensor_type == "temperature":
                return -50 <= value <= 60
            elif self.sensor_type == "humidity":
                return 0 <= value <= 100
            elif self.sensor_type == "pressure":
                return 800 <= value <= 1200
            elif self.sensor_type == "wind":
                return 0 <= value <= 360 if "direction" in self.entity_id else value >= 0
            elif self.sensor_type == "uv":
                return 0 <= value <= 20
            elif self.sensor_type == "solar":
                return value >= 0
            return True
        except ValueError:
            return False

@router.get(
    "/sensors",
    response_model=List[SensorData],
    summary="Get Sensor Data",
    description="Retrieves the current state of all configured sensors from Home Assistant",
    responses={
        200: {
            "description": "Successfully retrieved sensor data",
            "content": {
                "application/json": {
                    "example": [{
                        "entity_id": "sensor.ws2900_v2_02_03_outdoor_temperature",
                        "state": "-3.8",
                        "attributes": {
                            "state_class": "measurement",
                            "unit_of_measurement": "°C",
                            "device_class": "temperature",
                            "friendly_name": "WS2900_V2.02.03 Outdoor Temperature"
                        },
                        "last_updated": "2024-02-10T18:36:52.245418+00:00"
                    }, {
                        "entity_id": "sensor.ws2900_v2_02_03_humidity",
                        "state": "85",
                        "attributes": {
                            "state_class": "measurement",
                            "unit_of_measurement": "%",
                            "device_class": "humidity",
                            "friendly_name": "WS2900_V2.02.03 Humidity"
                        }
                    }, {
                        "entity_id": "sensor.ws2900_v2_02_03_wind_direction",
                        "state": "180",
                        "attributes": {
                            "state_class": "measurement",
                            "unit_of_measurement": "°",
                            "friendly_name": "WS2900_V2.02.03 Wind Direction"
                        }
                    }]
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Error fetching sensor data"}
                }
            }
        }
    }
)
async def get_sensor_data():
    """
    Fetches current sensor data from Home Assistant.
    
    Returns a list of sensor states including:
    - Current value
    - Sensor attributes
    - Last update timestamp
    """
    headers = {
        "Authorization": f"Bearer {settings.HASS_TOKEN}",
        "Content-Type": "application/json",
    }
    
    try:
        async with httpx.AsyncClient() as client:
            responses = []
            for sensor_id in settings.SENSOR_IDS:
                response = await client.get(
                    f"{settings.HASS_URL}/api/states/{sensor_id}",
                    headers=headers
                )
                if response.status_code == 200:
                    responses.append(response.json())
                else:
                    raise HTTPException(
                        status_code=response.status_code, 
                        detail=f"Error fetching sensor {sensor_id}"
                    )
                    
            return responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sensors/{sensor_id}/history")
async def get_sensor_history(sensor_id: str):
    """Returns last 24 hours of data for a sensor"""
    headers = {
        "Authorization": f"Bearer {settings.HASS_TOKEN}",
        "Content-Type": "application/json",
    }
    
    # Calculate timestamp for 24 hours ago
    timestamp = (datetime.utcnow() - timedelta(hours=24)).isoformat()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.HASS_URL}/api/history/period/{timestamp}",
                headers=headers,
                params={"filter_entity_id": sensor_id}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    history = data[0]  # Get the first array (sensor data)
                    
                    # Add debug logging
                    print(f"Raw values: {[item['state'] for item in history]}")
                    
                    # More robust value filtering and conversion
                    values = []
                    for item in history:
                        try:
                            # Handle negative numbers and decimals
                            if item['state'].replace('-', '').replace('.', '').isdigit():
                                values.append(float(item['state']))
                        except (ValueError, AttributeError):
                            continue
                    
                    if values:
                        stats = {
                            'min': min(values),
                            'max': max(values),
                            'current': values[-1],
                            'history': history
                        }
                        print(f"Calculated stats: {stats}")  # Debug log
                        return stats
                    
            raise HTTPException(status_code=response.status_code, detail="Error fetching history")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 