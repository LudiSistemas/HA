# Weather Station Web App

A modern, responsive web application for displaying Home Assistant sensor data. Built with React and styled-components, featuring a cyberpunk-inspired design.

## Features

- Real-time weather data display
- Responsive design optimized for mobile devices
- Cyberpunk-inspired UI with neon accents
- Auto-refresh every minute
- Error handling and loading states
- Production-ready Nginx configuration
- Cloudflare integration

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure your backend API URL in `.env`:
```
VITE_BACKEND_URL=https://your-api-domain.com
```

4. Start development server:
```bash
npm run dev
```

## Production Build

1. Build the application:
```bash
npm run build
```

This creates a `dist` directory with optimized static files.

## Deployment

### Prerequisites
- Nginx
- Node.js 18+
- Cloudflare account
- Domain name

### Nginx Configuration

1. Copy the example Nginx configuration:
```bash
sudo cp nginx/webappconfig.example /etc/nginx/sites-available/weather-webapp
```

2. Edit the configuration:
```bash
sudo nano /etc/nginx/sites-available/weather-webapp
```

Update:
- `server_name` with your domain
- `root` path to point to your dist directory

3. Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/weather-webapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Cloudflare Setup

1. Add your domain to Cloudflare
2. Set SSL/TLS encryption mode to "Full"
3. Create an A record pointing to your server's IP
4. Enable "Always Use HTTPS"
5. Enable Cloudflare proxy (orange cloud)

## Project Structure

```
weather-webapp/
├── src/
│   ├── components/
│   │   └── WeatherDisplay.jsx  # Main display component
│   ├── App.jsx                 # Application root
│   └── main.jsx               # Entry point
├── nginx/
│   └── webappconfig.example   # Nginx configuration template
├── .env.example              # Environment variables template
├── index.html               # HTML template
├── vite.config.js          # Vite configuration
└── package.json            # Project dependencies
```

## Environment Variables

- `VITE_BACKEND_URL`: URL of the Home Assistant sensor proxy API

## Security

The application implements several security measures:

- Basic security headers via Nginx
- Cloudflare IP restriction
- SSL/TLS encryption via Cloudflare
- Static file caching
- Gzip compression

## Development

The application uses:
- React 18
- styled-components for styling
- Vite for building and development
- Environment variables for configuration

## API Integration

The application expects the following JSON format from the API:
```json
[
  {
    "entity_id": "sensor.temperature",
    "state": "20.5",
    "attributes": {
      "unit_of_measurement": "°C",
      "friendly_name": "Temperature"
    },
    "last_updated": "2024-02-10T19:28:04.298138+00:00"
  }
]
```

## Maintenance

- Check logs: `sudo tail -f /var/log/nginx/error.log`
- Restart Nginx: `sudo systemctl restart nginx`
- Update application:
  ```bash
  git pull
  npm install
  npm run build
  ```

## Related Projects

- [Home Assistant Sensor Proxy](../rest/backend/README.md) - Backend API service

## Requirements

- Node.js 18+
- npm 9+
- Nginx
- Modern web browser
- Cloudflare account 