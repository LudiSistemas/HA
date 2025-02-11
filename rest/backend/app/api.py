from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional, Literal, Dict, Tuple
import httpx
from pydantic import BaseModel, Field
from app.config import settings
from datetime import datetime, timedelta
import logging
from collections import defaultdict
from ipaddress import ip_address
import time

# Get the FastAPI logger
logger = logging.getLogger("main")

# Create router with prefix to match nginx location
router = APIRouter(prefix="/api", tags=["sensors"])

# Cache storage
sensor_cache: Dict[str, Tuple[list, datetime]] = {}
CACHE_TTL = 60  # seconds

# Analytics storage
analytics_data = {
    'total_visits': 0,
    'unique_visitors': set(),
    'hourly_stats': defaultdict(int),
    'sensor_requests': defaultdict(int),
}

def get_cached_data() -> Optional[list]:
    """Get cached sensor data if it's still valid"""
    if not sensor_cache:
        logger.info("🔄 CACHE: Empty cache")
        return None
        
    data, timestamp = sensor_cache.get('sensors', (None, None))
    if not data or not timestamp:
        logger.info("🔄 CACHE: No data or timestamp")
        return None
        
    age = (datetime.now() - timestamp).total_seconds()
    if age > CACHE_TTL:
        logger.info(f"🔄 CACHE: Expired ({age:.1f} seconds old)")
        return None
        
    logger.info(f"✅ CACHE HIT! Data is {age:.1f} seconds old")
    return data

def update_cache(data: list) -> None:
    """Update the cache with new sensor data"""
    sensor_cache['sensors'] = (data, datetime.now())
    logger.info(f"💾 CACHE: Updated with {len(data)} sensors at {datetime.now().strftime('%H:%M:%S')}")

def update_analytics(request: Request):
    """Update analytics data for each request"""
    try:
        # Get client IP from Cloudflare or fallback to direct IP
        client_ip = request.headers.get('cf-connecting-ip') or request.headers.get('x-real-ip') or request.client.host
        
        # Update total visits
        analytics_data['total_visits'] += 1
        
        # Update unique visitors
        analytics_data['unique_visitors'].add(client_ip)
        
        # Update hourly stats
        current_hour = time.strftime('%Y-%m-%d %H:00')
        analytics_data['hourly_stats'][current_hour] += 1
        
        # Clean up old hourly stats (keep last 24 hours)
        cutoff = time.time() - (24 * 3600)
        analytics_data['hourly_stats'] = {
            k: v for k, v in analytics_data['hourly_stats'].items()
            if time.strptime(k, '%Y-%m-%d %H:00').timestamp() > cutoff
        }
        
    except Exception as e:
        logger.error(f"Error updating analytics: {e}")

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
    state_class: Optional[str] = "measurement"
    device_class: Optional[str] = None
    
    class Config:
        extra = "allow"  # Allow additional fields in attributes

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
        elif "rain" in self.entity_id:
            return "rain"
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
            elif self.sensor_type == "rain":
                return value >= 0
            return True
        except ValueError:
            return False

def parse_sensor_ids(sensor_ids):
    """Parse sensor IDs from various formats"""
    if isinstance(sensor_ids, list):
        # If it's a list with a single string containing commas, split it
        if len(sensor_ids) == 1 and ',' in sensor_ids[0]:
            return [s.strip() for s in sensor_ids[0].split(',')]
        return sensor_ids
    
    # Remove square brackets and extra quotes if present
    cleaned = sensor_ids.strip('[]"\' ')
    return [s.strip() for s in cleaned.split(',')]

@router.get(
    "/sensors",
    response_model=List[SensorData],
    summary="Get Sensor Data",
    description="Retrieves the current state of all configured sensors from Home Assistant"
)
async def get_sensor_data(request: Request):
    """
    Fetches current sensor data from Home Assistant.
    Uses cache if data is less than 60 seconds old.
    """
    update_analytics(request)
    cached_data = get_cached_data()
    if cached_data:
        logger.info("🎯 CACHE: Serving cached data")
        return cached_data
        
    logger.info("⚡ CACHE MISS: Fetching fresh data from Home Assistant")
    headers = {
        "Authorization": f"Bearer {settings.HASS_TOKEN}",
        "Content-Type": "application/json",
    }
    
    try:
        async with httpx.AsyncClient() as client:
            responses = []
            sensor_ids = settings.sensor_list
            
            for sensor_id in sensor_ids:
                try:
                    url = f"{settings.HASS_URL}/api/states/{sensor_id}"
                    response = await client.get(
                        url,
                        headers=headers,
                        timeout=10.0
                    )
                    
                    if response.status_code == 200:
                        sensor_data = response.json()
                        try:
                            validated_data = SensorData(**sensor_data)
                            if validated_data.validate_state():
                                responses.append(sensor_data)
                            else:
                                print(f"Invalid state value for sensor {sensor_id}: {sensor_data['state']}")
                        except Exception as e:
                            print(f"Validation error for sensor {sensor_id}: {e}")
                    else:
                        print(f"Error fetching sensor {sensor_id}: HTTP {response.status_code}")
                except Exception as e:
                    print(f"Request error for sensor {sensor_id}: {str(e)}")
                    continue
            
            if not responses:
                raise HTTPException(
                    status_code=500, 
                    detail="No valid sensor data retrieved. Check server logs for details."
                )
            
            # Update cache with new data
            update_cache(responses)
            print(f"Successfully retrieved and cached {len(responses)} sensors")
            
            return responses
            
    except Exception as e:
        print(f"Error in get_sensor_data: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch sensor data: {str(e)}"
        )

@router.get("/sensors/{sensor_id}/history")
async def get_sensor_history(sensor_id: str, request: Request):
    """Returns last 24 hours of data for a sensor"""
    update_analytics(request)
    analytics_data['sensor_requests'][sensor_id] += 1
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

@router.get("/stats")
async def get_stats():
    """Get site statistics"""
    return {
        'total_visits': analytics_data['total_visits'],
        'unique_visitors': len(analytics_data['unique_visitors']),
        'last_24h_visits': sum(analytics_data['hourly_stats'].values()),
        'hourly_stats': dict(analytics_data['hourly_stats']),
        'sensor_stats': dict(analytics_data['sensor_requests'])
    } 