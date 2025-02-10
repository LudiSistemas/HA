from fastapi import APIRouter, HTTPException
import httpx
from app.config import settings

# Create router with prefix to match nginx location
router = APIRouter(prefix="/api")

@router.get("/sensors")
async def get_sensor_data():
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
                    raise HTTPException(status_code=response.status_code, 
                                     detail=f"Error fetching sensor {sensor_id}")
                    
            return responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 