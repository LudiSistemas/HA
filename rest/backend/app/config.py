from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    HASS_URL: str
    HASS_TOKEN: str
    SENSOR_IDS: List[str]
    CORS_ORIGINS: List[str]

    class Config:
        env_file = ".env"

settings = Settings() 