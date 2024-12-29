# Bez Struje Scraper za Home Assistant

Ova integracija omogućava praćenje planiranih isključenja električne energije za područje ED Leskovac, sa posebnim fokusom na naselje Negosavlje.

## Instalacija

1. Napravite novi folder `python_scripts/bez_struje` u vašem Home Assistant konfiguracionom direktorijumu
2. Kopirajte fajl `power_outage_scraper.py` u taj folder

### Konfiguracija u configuration.yaml

```yaml
sensor:
  - platform: power_outage
```
Sada je potrebno dodati custom component u Home Assistant. Najednostavnije koristiti Studio Code server integraciju za ovo. 

