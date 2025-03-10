import os
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Union, List, Optional
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings"""
    
    # API settings
    ENVIRONMENT: str = "development"
    
    # Home Assistant settings
    HASS_URL: str
    HASS_TOKEN: str
    SENSOR_IDS: Union[str, List[str]]  # Can be either string or list
    POWER_SENSOR_IDS: Optional[str] = ""  # Add this line to support power sensors
    STATION_ALTITUDE: float = Field(default=230.0)  # Simplified field definition
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    @property
    def sensor_list(self) -> List[str]:
        """Convert SENSOR_IDS to list format"""
        if isinstance(self.SENSOR_IDS, str):
            return [s.strip() for s in self.SENSOR_IDS.split(',')]
        return self.SENSOR_IDS

@lru_cache()
def get_settings():
    """Get cached settings"""
    return Settings()

settings = Settings()  # The Config class will handle env file loading 