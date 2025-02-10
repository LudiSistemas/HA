from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import APIKeyHeader
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from app.api import router
from app.config import settings
import time

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

# Security middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET"],  # Restrict to GET only since we're only reading data
    allow_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["your-domain.com", "localhost", "localhost:8000"]  # Add your domain
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Server"] = ""  # Remove server header
    return response

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    print(f"{request.method} {request.url.path} - {response.status_code} - {duration:.2f}s")
    return response

# Global rate limit
@app.middleware("http")
@limiter.limit("60/minute")  # Adjust rate limit as needed
async def global_rate_limit(request: Request, call_next):
    response = await call_next(request)
    return response

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}  # Don't expose error details in production
    )

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=False,  # Disable reload in production
        ssl_keyfile="key.pem",  # Add SSL certificate
        ssl_certfile="cert.pem"
    ) 