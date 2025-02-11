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
from math import exp
import json
import os
from pathlib import Path

# Get the FastAPI logger
logger = logging.getLogger("main")

# Create router with prefix to match nginx location
router = APIRouter(prefix="/api", tags=["sensors"])

# Cache storage
sensor_cache: Dict[str, Tuple[list, datetime]] = {}
CACHE_TTL = 60  # seconds

# Define path for analytics data
ANALYTICS_FILE = Path(__file__).parent.parent / 'data' / 'analytics.json'

# Add session tracking
SESSION_DURATION = 30 * 60  # 30 minutes in seconds
active_sessions = {}

def is_new_session(client_ip: str) -> bool:
    """Check if this is a new session for the IP"""
    current_time = time.time()
    
    # Clean up expired sessions
    expired = [ip for ip, timestamp in active_sessions.items() 
              if current_time - timestamp > SESSION_DURATION]
    for ip in expired:
        del active_sessions[ip]
    
    # Check if this is a new session
    if client_ip not in active_sessions:
        active_sessions[client_ip] = current_time
        return True
    
    # Update session timestamp
    active_sessions[client_ip] = current_time
    return False

def load_analytics():
    """Load analytics data from file"""
    try:
        if ANALYTICS_FILE.exists():
            with open(ANALYTICS_FILE, 'r') as f:
                data = json.load(f)
                return {
                    'total_visits': data.get('total_visits', 0),
                    'unique_visitors': set(data.get('unique_visitors', [])),
                    'hourly_stats': defaultdict(int, data.get('hourly_stats', {})),
                    'sensor_requests': defaultdict(int, data.get('sensor_requests', {})),
                    'last_save': data.get('last_save', datetime.now().isoformat())
                }
    except Exception as e:
        logger.error(f"Error loading analytics: {e}")
    
    return {
        'total_visits': 0,
        'unique_visitors': set(),
        'hourly_stats': defaultdict(int),
        'sensor_requests': defaultdict(int),
        'last_save': datetime.now().isoformat()
    }

def save_analytics(data):
    """Save analytics data to file"""
    try:
        # Create data directory if it doesn't exist
        ANALYTICS_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        # Prepare data for saving
        save_data = {
            'total_visits': data['total_visits'],
            'unique_visitors': list(data['unique_visitors']),  # Convert set to list
            'hourly_stats': dict(data['hourly_stats']),
            'sensor_requests': dict(data['sensor_requests']),
            'last_save': datetime.now().isoformat()
        }
        
        with open(ANALYTICS_FILE, 'w') as f:
            json.dump(save_data, f)
            
        logger.info("Analytics data saved successfully")
    except Exception as e:
        logger.error(f"Error saving analytics: {e}")

# Initialize analytics from file
analytics_data = load_analytics()

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
        
        # Only count as visit if it's a new session
        if is_new_session(client_ip):
            # Update total visits
            analytics_data['total_visits'] += 1
            
            # Update unique visitors
            analytics_data['unique_visitors'].add(client_ip)
            
            # Update hourly stats
            current_hour = datetime.now().strftime('%Y-%m-%d %H:00')
            analytics_data['hourly_stats'][current_hour] += 1
            
            # Clean up old hourly stats (keep last 24 hours)
            cutoff = datetime.now() - timedelta(hours=24)
            analytics_data['hourly_stats'] = {
                k: v for k, v in analytics_data['hourly_stats'].items()
                if datetime.strptime(k, '%Y-%m-%d %H:00') > cutoff
            }
            
            # Save to file periodically (every 10 visits)
            if analytics_data['total_visits'] % 10 == 0:
                save_analytics(analytics_data)
            
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
                return 900 <= value <= 1100
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

def calculate_relative_pressure(absolute_pressure: float, altitude: float, temperature: float) -> float:
    """
    Calculate mean sea level pressure using the International Standard Atmosphere formula:
    P0 = P1 (1 - (0.0065h/ (T + 0.0065h + 273.15)))-5.257
    
    Parameters:
    - absolute_pressure: Station pressure (P1) in hPa
    - altitude: Station elevation (h) in meters
    - temperature: Temperature (T) in Celsius
    
    Returns:
    - Mean sea level pressure (P0) in hPa
    """
    try:
        # P0 = P1 (1 - (0.0065h/ (T + 0.0065h + 273.15)))-5.257
        P1 = float(absolute_pressure)
        h = float(altitude)
        T = float(temperature)
        
        denominator = T + (0.0065 * h) + 273.15
        fraction = (0.0065 * h) / denominator
        
        P0 = P1 * pow(1 - fraction, -5.257)
        
        return round(P0, 1)
    except Exception as e:
        logger.error(f"Error calculating sea level pressure: {e}")
        return absolute_pressure

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
                                # If this is absolute pressure, calculate relative pressure
                                if 'absolute_pressure' in sensor_id:
                                    # Get temperature for calculation
                                    temp_sensor = next(
                                        (s for s in responses if 'temperature' in s['entity_id']),
                                        None
                                    )
                                    temp = float(temp_sensor['state']) if temp_sensor else 15  # default temp if not found
                                    
                                    try:
                                        abs_pressure = float(sensor_data['state'])
                                        rel_pressure = calculate_relative_pressure(
                                            abs_pressure,
                                            float(settings.STATION_ALTITUDE),
                                            temp
                                        )
                                        
                                        # Add both pressures to attributes
                                        sensor_data['attributes']['absolute_pressure'] = abs_pressure
                                        sensor_data['attributes']['relative_pressure'] = rel_pressure
                                        # Update the main state to show relative pressure
                                        sensor_data['state'] = str(rel_pressure)
                                    except (ValueError, TypeError) as e:
                                        logger.error(f"Error calculating relative pressure: {e}")
                                
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
async def get_sensor_history(sensor_id: str, request: Request, offset: int = 0):
    """Returns 24 hours of data for a sensor with specified offset in days"""
    update_analytics(request)
    analytics_data['sensor_requests'][sensor_id] += 1
    headers = {
        "Authorization": f"Bearer {settings.HASS_TOKEN}",
        "Content-Type": "application/json",
    }
    
    try:
        # Calculate timestamps for the requested period
        now = datetime.now()
        end_time = now - timedelta(days=offset)
        start_time = end_time - timedelta(hours=24)
        
        # Format timestamps in ISO format
        start_time_iso = start_time.isoformat()
        end_time_iso = end_time.isoformat()
        
        logger.info(f"Fetching history for {sensor_id} from {start_time_iso} to {end_time_iso}")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.HASS_URL}/api/history/period/{start_time_iso}",
                headers=headers,
                params={
                    "filter_entity_id": sensor_id,
                    "end_time": end_time_iso,
                    "minimal_response": True
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    history = data[0]
                    
                    # Filter and validate values
                    values = []
                    filtered_history = []
                    for item in history:
                        try:
                            if item['state'].replace('-', '').replace('.', '').isdigit():
                                value = float(item['state'])
                                values.append(value)
                                filtered_history.append(item)
                        except (ValueError, AttributeError):
                            continue
                    
                    if values:
                        stats = {
                            'min': min(values),
                            'max': max(values),
                            'current': values[-1],
                            'history': filtered_history,
                            'start_time': start_time_iso,
                            'end_time': end_time_iso
                        }
                        return stats
                    
                logger.warning(f"No valid data found for {sensor_id} in the specified period")
                raise HTTPException(status_code=404, detail="No data found for the specified period")
                    
            logger.error(f"Error fetching history: HTTP {response.status_code}")
            raise HTTPException(status_code=response.status_code, detail="Error fetching history")
            
    except Exception as e:
        logger.error(f"Error in get_sensor_history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_stats():
    """Get site statistics"""
    try:
        # Calculate visits in last 24h
        cutoff = datetime.now() - timedelta(hours=24)
        last_24h_visits = sum(
            count for timestamp, count in analytics_data['hourly_stats'].items()
            if datetime.strptime(timestamp, '%Y-%m-%d %H:00') > cutoff
        )
        
        # Calculate active sessions
        current_time = time.time()
        active_count = sum(1 for timestamp in active_sessions.values() 
                         if current_time - timestamp <= SESSION_DURATION)
        
        return {
            'total_visits': analytics_data['total_visits'],
            'unique_visitors': len(analytics_data['unique_visitors']),
            'last_24h_visits': last_24h_visits,
            'active_sessions': active_count,
            'hourly_stats': dict(analytics_data['hourly_stats']),
            'sensor_stats': dict(analytics_data['sensor_requests'])
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving statistics")

# Add new endpoint to get user's country
@router.get("/user-location")
async def get_user_location(request: Request):
    """Get user's country based on IP"""
    try:
        # Get client IP from Cloudflare or fallback to direct IP
        client_ip = request.headers.get('cf-connecting-ip') or request.headers.get('x-real-ip') or request.client.host
        
        # Use ip-api.com (free service) to get location
        async with httpx.AsyncClient() as client:
            response = await client.get(f'http://ip-api.com/json/{client_ip}')
            if response.status_code == 200:
                data = response.json()
                return {
                    'country': data.get('country'),
                    'countryCode': data.get('countryCode')
                }
            return {'country': 'Unknown', 'countryCode': 'UN'}
    except Exception as e:
        logger.error(f"Error getting location: {e}")
        return {'country': 'Unknown', 'countryCode': 'UN'}
    