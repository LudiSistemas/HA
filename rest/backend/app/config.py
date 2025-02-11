from pydantic import BaseSettings, Field
from typing import Union, List

class Settings(BaseSettings):
    HASS_URL: str
    HASS_TOKEN: str
    SENSOR_IDS: Union[str, List[str]]  # Can be either string or list
    ENVIRONMENT: str = "development"  # default value
    STATION_ALTITUDE: float = Field(default=230.0, env='STATION_ALTITUDE')  # Explicitly bind to env variable

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

settings = Settings(_env_file='.env')  # Explicitly specify env file 