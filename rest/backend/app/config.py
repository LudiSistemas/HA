from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Union, List

class Settings(BaseSettings):
    HASS_URL: str
    HASS_TOKEN: str
    SENSOR_IDS: Union[str, List[str]]  # Can be either string or list
    ENVIRONMENT: str = "development"  # default value
    STATION_ALTITUDE: float = Field(default=230.0)  # Simplified field definition

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

settings = Settings()  # The Config class will handle env file loading 