from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    HASS_URL: str
    HASS_TOKEN: str
    SENSOR_IDS: List[str]
    ENVIRONMENT: str = "development"  # default value

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings() 