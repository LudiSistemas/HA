from fastapi import APIRouter, HTTPException, Request
from typing import List
import httpx
from pydantic import BaseModel
from app.config import settings

# Create router with prefix to match nginx location
router = APIRouter(prefix="/api", tags=["sensors"])

# Debug route to check if API is accessible
@router.get("/ping")
async def ping():
    """Simple endpoint to verify API is working"""
    return {"status": "ok", "message": "API is running"}

# Debug route to see what sensors are configured
@router.get("/config")
async def get_config():
    """Returns current configuration (excluding sensitive data)"""
    return {
        "sensors": settings.SENSOR_IDS,
        "hass_url": settings.HASS_URL
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
                        "entity_id": "sensor.temperature_living_room",
                        "state": "21.5",
                        "attributes": {
                            "friendly_name": "Living Room Temperature",
                            "unit_of_measurement": "°C"
                        },
                        "last_updated": "2024-02-10T18:26:27+00:00"
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