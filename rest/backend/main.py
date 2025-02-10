from fastapi import FastAPI, Request
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

# Create limiter instance
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Rest Dashboard API",
    docs_url=None,  # Disable Swagger UI in production
    redoc_url=None  # Disable ReDoc in production
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

app.include_router(router)

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