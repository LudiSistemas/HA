"""Platform for Power Outage sensor integration."""
from . import PowerOutageSensor

async def async_setup_platform(hass, config, async_add_entities, discovery_info=None):
    """Set up the sensor platform."""
    async_add_entities([PowerOutageSensor()])
