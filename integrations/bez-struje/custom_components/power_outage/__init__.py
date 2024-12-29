"""The Power Outage component."""
from datetime import timedelta
import logging
import voluptuous as vol

from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.typing import ConfigType, DiscoveryInfoType
from homeassistant.components.sensor import SensorEntity
import homeassistant.helpers.config_validation as cv
from homeassistant.util import Throttle

import requests
from bs4 import BeautifulSoup
import re

_LOGGER = logging.getLogger(__name__)

DOMAIN = "power_outage"
SCAN_INTERVAL = timedelta(hours=1)  # Changed to 1 hour

class PowerOutageSensor(SensorEntity):
    """Representation of a Power Outage Sensor."""

    def __init__(self):
        """Initialize the sensor."""
        self._state = None
        self._attributes = {}
        self._available = True
        self._attr_name = "Power Outage Negosavlje"
        self._attr_unique_id = "power_outage_negosavlje"
        self._last_outages = set()  # To track previous outages

    @property
    def name(self):
        """Return the name of the sensor."""
        return self._attr_name

    @property
    def state(self):
        """Return the state of the sensor."""
        return self._state

    @property
    def extra_state_attributes(self):
        """Return the state attributes."""
        return self._attributes

    def update(self):
        """Fetch new state data for the sensor."""
        try:
            url = "http://www.bezstruje.com/?es=ED+Leskovac"
            target_location = "Негосавље"
            
            response = requests.get(url)
            response.encoding = 'utf-8'
            
            soup = BeautifulSoup(response.text, 'html.parser')
            content = soup.find('p', class_='text-warning')
            
            if not content:
                self._state = "false"
                self._attributes = {"outages": []}
                return
                
            text = content.get_text()
            outages = []
            current_date = None
            current_time = None
            
            for line in text.split('\n'):
                line = line.strip()
                if not line:
                    continue
                
                date_match = re.search(r'Петак|Субота|Недеља|Понедељак|Уторак|Среда|Четвртак.+?(\d{1,2}\.\d{2}\.)', line)
                if date_match:
                    current_date = line.split(',')[1].strip()
                    continue
                
                time_match = re.search(r'(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})', line)
                if time_match:
                    current_time = line.strip()
                    continue
                
                if target_location in line and current_date and current_time:
                    outage = {
                        'date': current_date,
                        'time': current_time,
                        'description': line
                    }
                    outages.append(outage)
            
            # Create set of current outages for comparison
            current_outages = {f"{o['date']}-{o['time']}-{o['description']}" for o in outages}
            
            # Only set state to true if we have new outages
            if current_outages and current_outages != self._last_outages:
                self._state = "true"
                self._last_outages = current_outages
            else:
                self._state = "false"
            
            self._attributes = {"outages": outages}
            
        except Exception as e:
            _LOGGER.error("Error fetching power outage data: %s", str(e))
            self._state = None
            self._attributes = {}
