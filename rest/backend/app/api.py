from fastapi import APIRouter, HTTPException, Request
from typing import List
import httpx
from pydantic import BaseModel
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

# Response model for better OpenAPI documentation
class SensorData(BaseModel):
    entity_id: str
    state: str
    attributes: dict
    last_updated: str

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
                        "last_updated": "2025-02-10T18:36:52.245418+00:00"
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