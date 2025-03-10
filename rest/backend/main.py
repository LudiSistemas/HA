from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from app.api import router
from app.config import settings
import time
import os
import logging
from pathlib import Path
import json
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import asyncio
import aiohttp

# Load environment variables
load_dotenv()

# Create data directory if it doesn't exist
data_dir = Path(__file__).parent / 'data'
data_dir.mkdir(exist_ok=True)

# Create limiter instance
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Home Assistant Sensor Proxy",
    description="API for proxying Home Assistant sensor data",
    version="1.0.0",
    docs_url="/api/docs",  # Always enable docs for now
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"  # Important for Swagger to work
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Basic CORS - Nginx will handle the rest
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Nginx will handle actual CORS
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Add this after creating the FastAPI app
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
HASS_URL = settings.HASS_URL
HASS_TOKEN = settings.HASS_TOKEN
SENSOR_IDS = settings.sensor_list
POWER_SENSOR_IDS = settings.power_sensor_list
STATION_ALTITUDE = settings.STATION_ALTITUDE

# Cache for sensor data
sensor_cache = {}
power_sensor_cache = {}
power_history_cache = {}
last_cache_update = 0
last_power_cache_update = 0
last_power_history_update = 0
CACHE_DURATION = 300  # 5 minutes in seconds
POWER_CACHE_DURATION = 60  # 1 minute in seconds
POWER_HISTORY_CACHE_DURATION = 3600  # 1 hour in seconds

# Headers for Home Assistant API
headers = {
    "Authorization": f"Bearer {HASS_TOKEN}",
    "Content-Type": "application/json",
}

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Get real IP from Nginx headers
    forwarded_for = request.headers.get("X-Forwarded-For")
    real_ip = forwarded_for.split(",")[0] if forwarded_for else request.client.host
    
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    logger.info(f"Headers: {request.headers}")
    
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    logger.info(f"{real_ip} - {request.method} {request.url.path} - {response.status_code} - {duration:.2f}s")
    return response

# Global rate limit - using X-Forwarded-For for proper IP behind proxy
@app.middleware("http")
@limiter.limit("60/minute")
async def global_rate_limit(request: Request, call_next):
    response = await call_next(request)
    return response

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Include the API router
app.include_router(router)

# Root route
@app.get("/")
async def root():
    return {
        "message": "Power Monitoring API is running",
        "docs_url": "/api/docs"
    }

async def fetch_power_sensor_data():
    """Fetch current power sensor data from Home Assistant"""
    global power_sensor_cache, last_power_cache_update
    
    current_time = time.time()
    if current_time - last_power_cache_update < POWER_CACHE_DURATION and power_sensor_cache:
        return power_sensor_cache
    
    try:
        async with aiohttp.ClientSession() as session:
            tasks = []
            for sensor_id in POWER_SENSOR_IDS:
                if not sensor_id:
                    continue
                url = f"{HASS_URL}/api/states/{sensor_id}"
                tasks.append(session.get(url, headers=headers))
            
            responses = await asyncio.gather(*tasks)
            
            power_data = {}
            for i, response in enumerate(responses):
                if response.status == 200:
                    data = await response.json()
                    sensor_id = POWER_SENSOR_IDS[i]
                    power_data[sensor_id] = {
                        "state": data.get("state"),
                        "last_updated": data.get("last_updated"),
                        "attributes": data.get("attributes", {})
                    }
                else:
                    logger.error(f"Failed to fetch data for sensor {POWER_SENSOR_IDS[i]}: {response.status}")
            
            if power_data:
                power_sensor_cache = power_data
                last_power_cache_update = current_time
                return power_data
            else:
                logger.error("No power sensor data retrieved")
                return power_sensor_cache if power_sensor_cache else {}
    
    except Exception as e:
        logger.error(f"Error fetching power sensor data: {e}")
        return power_sensor_cache if power_sensor_cache else {}

async def fetch_power_history(start_time=None, end_time=None):
    """Fetch historical power sensor data from Home Assistant"""
    global power_history_cache, last_power_history_update
    
    current_time = time.time()
    cache_key = f"{start_time}_{end_time}"
    
    # Check if we have cached data for this specific time range
    if (current_time - last_power_history_update < POWER_HISTORY_CACHE_DURATION and 
        power_history_cache and 
        getattr(fetch_power_history, "last_cache_key", None) == cache_key):
        return power_history_cache
    
    if not start_time:
        # Default to last 24 hours
        start_time = (datetime.now() - timedelta(days=1)).isoformat()
    
    if not end_time:
        end_time = datetime.now().isoformat()
    
    try:
        logger.info(f"Fetching power history from {start_time} to {end_time}")
        url = f"{HASS_URL}/api/history/period/{start_time}"
        params = {
            "filter_entity_id": ",".join(POWER_SENSOR_IDS),
            "end_time": end_time,
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, params=params) as response:
                if response.status == 200:
                    history_data = await response.json()
                    
                    # Process and organize the data
                    processed_data = {}
                    for entity_data in history_data:
                        if not entity_data:
                            continue
                        
                        entity_id = entity_data[0]["entity_id"]
                        processed_data[entity_id] = [
                            {
                                "state": item["state"],
                                "timestamp": item["last_updated"],
                                "attributes": item.get("attributes", {})
                            }
                            for item in entity_data
                        ]
                    
                    power_history_cache = processed_data
                    last_power_history_update = current_time
                    fetch_power_history.last_cache_key = cache_key
                    return processed_data
                else:
                    logger.error(f"Failed to fetch history data: {response.status}")
                    return power_history_cache if power_history_cache else {}
    
    except Exception as e:
        logger.error(f"Error fetching power history data: {e}")
        return power_history_cache if power_history_cache else {}

# Initialize the last_cache_key attribute
fetch_power_history.last_cache_key = None

@app.get("/api/power/current")
async def get_power_data():
    """Get current power sensor data"""
    power_data = await fetch_power_sensor_data()
    if not power_data:
        raise HTTPException(status_code=503, detail="Failed to retrieve power sensor data")
    return power_data

@app.get("/api/power/history")
async def get_power_history(start_time: Optional[str] = None, end_time: Optional[str] = None):
    """Get historical power sensor data"""
    history_data = await fetch_power_history(start_time, end_time)
    if not history_data:
        raise HTTPException(status_code=503, detail="Failed to retrieve power history data")
    return history_data

@app.get("/api/power/stats")
async def get_power_stats(days: int = 30):
    """Get power statistics for voltage quality analysis"""
    global power_history_cache, last_power_history_update
    
    try:
        # Calculate the start time based on the requested days
        start_time = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Clear the cache if we're requesting a different time range
        # This ensures we get fresh data when changing the time range
        if days != getattr(get_power_stats, "last_days", None):
            power_history_cache = {}
            last_power_history_update = 0
            get_power_stats.last_days = days
        
        # Fetch the historical data
        history_data = await fetch_power_history(start_time)
        
        if not history_data:
            raise HTTPException(status_code=503, detail="Failed to retrieve power history data")
        
        # Define the acceptable voltage range (230V ±10%)
        min_voltage = 207  # 230 - 10%
        max_voltage = 253  # 230 + 10%
        
        # Calculate statistics for each phase
        stats = {}
        for sensor_id, data in history_data.items():
            if not data:
                continue
                
            # Count readings within and outside the acceptable range
            total_readings = len(data)
            in_range_count = 0
            below_range_count = 0
            above_range_count = 0
            
            voltage_values = []
            timestamps = []
            
            for reading in data:
                try:
                    voltage = float(reading["state"])
                    voltage_values.append(voltage)
                    timestamps.append(reading["timestamp"])
                    
                    if min_voltage <= voltage <= max_voltage:
                        in_range_count += 1
                    elif voltage < min_voltage:
                        below_range_count += 1
                    else:
                        above_range_count += 1
                except (ValueError, TypeError):
                    # Skip invalid readings
                    continue
            
            if total_readings > 0:
                stats[sensor_id] = {
                    "total_readings": total_readings,
                    "in_range_count": in_range_count,
                    "below_range_count": below_range_count,
                    "above_range_count": above_range_count,
                    "in_range_percentage": (in_range_count / total_readings) * 100 if total_readings > 0 else 0,
                    "below_range_percentage": (below_range_count / total_readings) * 100 if total_readings > 0 else 0,
                    "above_range_percentage": (above_range_count / total_readings) * 100 if total_readings > 0 else 0,
                    "min_voltage": min(voltage_values) if voltage_values else None,
                    "max_voltage": max(voltage_values) if voltage_values else None,
                    "avg_voltage": sum(voltage_values) / len(voltage_values) if voltage_values else None,
                    "voltage_data": list(zip(timestamps, voltage_values)),
                    "acceptable_range": {
                        "min": min_voltage,
                        "max": max_voltage,
                        "nominal": 230
                    }
                }
        
        return stats
    
    except Exception as e:
        logger.error(f"Error calculating power statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Error calculating power statistics: {str(e)}")

# Initialize the last_days attribute
get_power_stats.last_days = None

if __name__ == "__main__":
    import uvicorn
    
    is_dev = os.getenv("ENVIRONMENT", "development") == "development"
    
    # Basic configuration - no SSL since Nginx handles it
    config = {
        "app": "main:app",
        "host": "127.0.0.1",  # Only listen on localhost since Nginx proxies
        "port": 8000,
        "reload": is_dev
    }
    
    uvicorn.run(**config) 