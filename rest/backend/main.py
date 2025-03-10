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
from math import isnan

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
        logger.info(f"Using cached power history data for {cache_key}")
        return power_history_cache
    
    if not start_time:
        # Default to last 24 hours
        start_time = (datetime.now() - timedelta(days=1)).isoformat()
        logger.info(f"No start_time provided, using default: {start_time}")
    
    if not end_time:
        end_time = datetime.now().isoformat()
        logger.info(f"No end_time provided, using default: {end_time}")
    
    try:
        logger.info(f"Fetching power history from {start_time} to {end_time}")
        
        # Parse the dates to ensure they're valid
        try:
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            
            # Calculate time difference in days
            days_diff = (end_dt - start_dt).total_seconds() / 86400  # Convert to days
            logger.info(f"Time range is {days_diff:.2f} days")
            
            # Ensure the time range is not too large (limit to 30 days max)
            if days_diff > 30:
                logger.warning(f"Time range too large ({days_diff:.2f} days), limiting to 30 days")
                start_dt = end_dt - timedelta(days=30)
                start_time = start_dt.isoformat()
                days_diff = 30
                
            # Ensure we have at least some minimum time range
            if days_diff < 0.1:  # Less than 2.4 hours
                logger.warning(f"Time range too small ({days_diff:.2f} days), using at least 24 hours")
                start_dt = end_dt - timedelta(days=1)
                start_time = start_dt.isoformat()
                days_diff = 1
        except ValueError as e:
            # Handle ISO format error
            logger.warning(f"Error parsing dates: {e}, using default parameters")
            end_time = datetime.now().isoformat()
            start_time = (datetime.now() - timedelta(days=1)).isoformat()
            days_diff = 1  # Default to 1 day
        
        url = f"{HASS_URL}/api/history/period/{start_time}"
        params = {
            "filter_entity_id": ",".join(POWER_SENSOR_IDS),
            "end_time": end_time,
            # For periods longer than 2 days, only get significant changes to reduce data volume
            "significant_changes_only": "true" if days_diff > 2 else "false",
            # For very long periods, also use minimal_response to further reduce data
            "minimal_response": "true" if days_diff > 14 else "false",
        }
        
        logger.info(f"History API params: {params}")
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, params=params) as response:
                if response.status == 200:
                    history_data = await response.json()
                    
                    # Process and organize the data
                    processed_data = {}
                    for entity_data in history_data:
                        if not entity_data or len(entity_data) == 0:
                            continue
                        
                        entity_id = entity_data[0].get("entity_id")
                        if not entity_id:
                            logger.warning(f"Missing entity_id in response: {entity_data[0]}")
                            continue
                            
                        processed_data[entity_id] = []
                        
                        for item in entity_data:
                            try:
                                # Check if the required fields exist
                                if "state" not in item:
                                    logger.warning(f"Missing 'state' in item: {item}")
                                    continue
                                    
                                # Use last_changed if last_updated is not available
                                timestamp = item.get("last_updated", item.get("last_changed"))
                                if not timestamp:
                                    logger.warning(f"Missing timestamp in item: {item}")
                                    continue
                                
                                # Parse the timestamp to check if it's within our requested range
                                item_dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                                if item_dt < start_dt or item_dt > end_dt:
                                    # Skip items outside our requested time range
                                    continue
                                
                                processed_data[entity_id].append({
                                    "state": item["state"],
                                    "timestamp": timestamp,
                                    "attributes": item.get("attributes", {})
                                })
                            except Exception as e:
                                logger.warning(f"Error processing history item: {e}")
                                continue
                    
                    # Log the number of data points received for each sensor
                    for sensor_id, data in processed_data.items():
                        logger.info(f"Received {len(data)} data points for {sensor_id}")
                        
                        # Log the time range of the data
                        if data:
                            try:
                                first_timestamp = datetime.fromisoformat(data[0]["timestamp"].replace('Z', '+00:00'))
                                last_timestamp = datetime.fromisoformat(data[-1]["timestamp"].replace('Z', '+00:00'))
                                data_range = (last_timestamp - first_timestamp).total_seconds() / 3600  # hours
                                logger.info(f"Data for {sensor_id} spans {data_range:.2f} hours, from {first_timestamp} to {last_timestamp}")
                            except Exception as e:
                                logger.warning(f"Error calculating data time range: {e}")
                    
                    power_history_cache = processed_data
                    last_power_history_update = current_time
                    fetch_power_history.last_cache_key = cache_key
                    return processed_data
                else:
                    logger.error(f"Failed to fetch history data: {response.status}")
                    return power_history_cache if power_history_cache else {}
    
    except Exception as e:
        logger.error(f"Error fetching power history data: {e}")
        logger.exception("Detailed error:")
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
async def get_power_stats(days: int = 1, start_time: str = None, end_time: str = None):
    """Get power statistics for the specified time period"""
    try:
        # If start_time and end_time are provided, use them directly
        if start_time and end_time:
            logger.info(f"Fetching power stats from {start_time} to {end_time}")
            history_data = await fetch_power_history(start_time=start_time, end_time=end_time)
        else:
            # Otherwise, calculate based on days parameter
            end_time = datetime.now().isoformat()
            start_time = (datetime.now() - timedelta(days=days)).isoformat()
            logger.info(f"Fetching power stats for last {days} days (from {start_time} to {end_time})")
            history_data = await fetch_power_history(start_time=start_time, end_time=end_time)
        
        if not history_data:
            logger.error("No history data received")
            raise HTTPException(status_code=503, detail="No power history data available")
        
        # Define acceptable voltage range
        min_acceptable = 207  # -10% of nominal 230V
        max_acceptable = 253  # +10% of nominal 230V
        
        # Define threshold for obvious measurement errors
        # Only filter out values that are clearly errors (below 100V)
        ERROR_THRESHOLD = 100
        
        # Calculate statistics for each phase
        stats = {}
        for sensor_id, data in history_data.items():
            if not data:
                logger.warning(f"No data for sensor {sensor_id}")
                continue
                
            # Count readings within and outside the acceptable range
            total_readings = len(data)
            in_range_count = 0
            below_range_count = 0
            above_range_count = 0
            
            voltage_values = []
            timestamps = []
            
            # First pass: collect all valid voltage values, filtering only obvious errors
            for reading in data:
                try:
                    voltage_str = reading["state"]
                    voltage = float(voltage_str)
                    
                    # Filter out only obvious measurement errors
                    if isnan(voltage) or voltage < ERROR_THRESHOLD:
                        logger.warning(f"Filtering obvious error for {sensor_id}: {voltage}V (from '{voltage_str}')")
                        continue
                        
                    voltage_values.append(voltage)
                    timestamps.append(reading["timestamp"])
                except (ValueError, TypeError) as e:
                    # Skip invalid readings
                    logger.warning(f"Invalid reading for {sensor_id}: {reading.get('state')} - {e}")
                    continue
            
            # Log all voltage values for debugging
            if len(voltage_values) > 0:
                logger.info(f"Voltage values for {sensor_id}: min={min(voltage_values)}, max={max(voltage_values)}, count={len(voltage_values)}")
                # Log the first few and last few values
                sample_size = min(5, len(voltage_values))
                logger.info(f"First {sample_size} values: {voltage_values[:sample_size]}")
                logger.info(f"Last {sample_size} values: {voltage_values[-sample_size:]}")
            
            # Second pass: calculate statistics
            if voltage_values:
                valid_readings = len(voltage_values)
                
                # Calculate min, max, avg
                min_voltage = min(voltage_values)
                max_voltage = max(voltage_values)
                avg_voltage = sum(voltage_values) / valid_readings
                
                # Count readings in different ranges
                for voltage in voltage_values:
                    if min_acceptable <= voltage <= max_acceptable:
                        in_range_count += 1
                    elif voltage < min_acceptable:
                        below_range_count += 1
                    else:
                        above_range_count += 1
                
                stats[sensor_id] = {
                    "total_readings": total_readings,
                    "valid_readings": valid_readings,
                    "in_range_count": in_range_count,
                    "below_range_count": below_range_count,
                    "above_range_count": above_range_count,
                    "in_range_percentage": (in_range_count / valid_readings) * 100 if valid_readings > 0 else 0,
                    "below_range_percentage": (below_range_count / valid_readings) * 100 if valid_readings > 0 else 0,
                    "above_range_percentage": (above_range_count / valid_readings) * 100 if valid_readings > 0 else 0,
                    "min_voltage": min_voltage,
                    "max_voltage": max_voltage,
                    "avg_voltage": avg_voltage,
                    "voltage_data": list(zip(timestamps, [str(v) for v in voltage_values])),
                    "acceptable_range": {
                        "min": min_acceptable,
                        "max": max_acceptable,
                        "nominal": 230
                    }
                }
                
                logger.info(f"Calculated stats for {sensor_id}: {valid_readings} valid readings, min: {min_voltage}, max: {max_voltage}, avg: {avg_voltage}")
            else:
                logger.warning(f"No valid voltage readings for {sensor_id}")
        
        if not stats:
            logger.error("No valid statistics could be calculated")
            raise HTTPException(status_code=503, detail="No valid power statistics could be calculated")
        
        return stats
    except Exception as e:
        logger.error(f"Error getting power stats: {e}")
        logger.exception("Detailed error:")
        raise HTTPException(status_code=500, detail=f"Error getting power statistics: {str(e)}")

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