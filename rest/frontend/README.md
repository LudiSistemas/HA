# Monitoring Kvaliteta Električne Energije

Ova aplikacija prikazuje podatke o kvalitetu električne energije iz Home Assistant-a, fokusirajući se na napon po fazama.

## Funkcionalnosti

- Prikaz trenutnog napona po fazama
- Grafički prikaz procenta vremena kada je napon u prihvatljivom opsegu (230V ±10%)
- Istorijski grafikon napona za svaku fazu
- Responzivan dizajn za mobilne i desktop uređaje
- Automatsko osvežavanje podataka

## Tehnologije

- Backend: FastAPI (Python)
- Frontend: React.js
- Stilizovanje: Tailwind CSS
- Grafikoni: Chart.js i React-Chartjs-2

## Uputstvo za pokretanje

### Preduslov

- Node.js (v14 ili noviji)
- Python 3.8 ili noviji
- Home Assistant sa Shelly EM3 senzorom

### Podešavanje backend-a

1. Navigirajte do backend direktorijuma:
   ```
   cd rest/backend
   ```

2. Kreirajte i aktivirajte virtuelno okruženje:
   ```
   python -m venv venv
   source venv/bin/activate  # Za Linux/Mac
   venv\Scripts\activate     # Za Windows
   ```

3. Instalirajte zavisnosti:
   ```
   pip install -r requirements.txt
   ```

4. Kopirajte `.env.example` u `.env` i podesite varijable:
   ```
   cp .env.example .env
   ```
   
   Otvorite `.env` fajl i podesite:
   - `HASS_URL`: URL vašeg Home Assistant-a
   - `HASS_TOKEN`: Long-lived access token iz Home Assistant-a
   - `POWER_SENSOR_IDS`: ID-jevi vaših senzora napona

5. Pokrenite backend server:
   ```
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Podešavanje frontend-a

1. Navigirajte do frontend direktorijuma:
   ```
   cd rest/frontend
   ```

2. Instalirajte zavisnosti:
   ```
   npm install
   ```

3. Pokrenite razvojni server:
   ```
   npm start
   ```

4. Aplikacija će biti dostupna na `http://localhost:3000`

### Produkciono okruženje

Za produkciono okruženje:

1. Izgradite frontend:
   ```
   cd rest/frontend
   npm run build
   ```

2. Kopirajte build direktorijum u statički direktorijum backend-a ili konfigurišite web server (nginx, Apache) da servira frontend.

3. Pokrenite backend bez reload opcije:
   ```
   cd rest/backend
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

## Prilagođavanje

- Za promenu opsega prihvatljivog napona, izmenite vrednosti `min_voltage` i `max_voltage` u `main.py` fajlu.
- Za promenu jezika ili naziva faza, izmenite odgovarajuće vrednosti u `App.js` fajlu.

## Napomene

- Aplikacija automatski keširа podatke da bi smanjila opterećenje na Home Assistant.
- Istorijski podaci se osvežavaju svakih sat vremena, a trenutni podaci svakih minut.
- Grafikon prikazuje poslednjih 100 tačaka podataka za bolju preglednost. 