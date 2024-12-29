# Bez Struje Scraper za Home Assistant

Ova integracija omogućava praćenje planiranih isključenja električne energije za područje ED Leskovac, sa posebnim fokusom na naselje Negosavlje.

## Instalacija

1. Napravite novi folder `python_scripts/bez_struje` u vašem Home Assistant konfiguracionom direktorijumu
2. Kopirajte fajl `bez_struje_scraper.py` u taj folder

### Konfiguracija u configuration.yaml

```yaml
sensor:
  - platform: bez_struje
```
