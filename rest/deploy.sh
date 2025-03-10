#!/bin/bash

# Exit on error
set -e

echo "=== Power Monitoring Application Deployment ==="
echo ""

# Check if running with sudo
if [ "$EUID" -eq 0 ]; then
  echo "Please don't run this script with sudo. It will ask for sudo when needed."
  exit 1
fi

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."
if ! command_exists node; then
  echo "Node.js is not installed. Please install Node.js v14 or newer."
  exit 1
fi

if ! command_exists npm; then
  echo "npm is not installed. Please install npm."
  exit 1
fi

if ! command_exists python3; then
  echo "Python 3 is not installed. Please install Python 3.8 or newer."
  exit 1
fi

if ! command_exists pip3; then
  echo "pip3 is not installed. Please install pip3."
  exit 1
fi

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
  echo "Error: This script must be run from the root directory of the project (where frontend and backend directories are located)."
  exit 1
fi

# Setup frontend environment
echo ""
echo "Setting up frontend environment..."
cd frontend

# Check if .env file exists for frontend
if [ ! -f ".env" ]; then
  echo "Creating .env file from .env.example..."
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "Please edit the frontend .env file with your backend API URL."
    echo "You can open it with: nano frontend/.env"
  else
    echo "Warning: .env.example not found for frontend. Creating a basic .env file."
    cat > .env << EOF
# Backend API URL - Set this to your backend API URL
REACT_APP_API_URL=http://localhost:8000

# Refresh interval in milliseconds (5 minutes)
REACT_APP_REFRESH_INTERVAL=300000

# Default time range in days
REACT_APP_DEFAULT_TIME_RANGE=30
EOF
    echo "Please edit the frontend .env file with your backend API URL."
    echo "You can open it with: nano frontend/.env"
  fi
fi

# Build frontend
echo ""
echo "Building frontend..."
npm install
npm run build
echo "Frontend build complete."

# Setup backend
echo ""
echo "Setting up backend..."
cd ../backend

# Check if virtual environment exists
if [ -d "venv" ]; then
  echo "Removing existing virtual environment..."
  rm -rf venv
fi

echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing backend dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Verify all dependencies are installed
echo "Verifying dependencies..."
python -c "import fastapi, uvicorn, dotenv, requests, pydantic, slowapi, aiohttp, httpx" || {
  echo "Error: Some dependencies are missing. Trying to reinstall..."
  pip install -r requirements.txt --force-reinstall
}

# Check if .env file exists for backend
if [ ! -f ".env" ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "Please edit the backend .env file with your Home Assistant URL and token."
  echo "You can open it with: nano backend/.env"
fi

# Create data directory if it doesn't exist
mkdir -p data

echo ""
echo "Deployment preparation complete!"
echo ""
echo "To start the application:"
echo "1. Make sure your .env files are configured correctly"
echo "   - Backend .env: Home Assistant URL and token"
echo "   - Frontend .env: Backend API URL"
echo ""
echo "2. Run the backend server:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   uvicorn main:app --host 0.0.0.0 --port 8000"
echo ""
echo "3. Serve the frontend static files:"
echo "   The static files are in: frontend/build"
echo "   You can serve them with any web server like Nginx or Apache"
echo ""
echo "Example Nginx configuration for the frontend:"
echo "-------------------------------------------"
echo "server {"
echo "    listen 80;"
echo "    server_name your-frontend-domain.com;"
echo ""
echo "    root /path/to/rest/frontend/build;"
echo "    index index.html;"
echo ""
echo "    location / {"
echo "        try_files \$uri \$uri/ /index.html;"
echo "    }"
echo "}"
echo ""
echo "Example Nginx configuration for the backend API:"
echo "----------------------------------------------"
echo "server {"
echo "    listen 80;"
echo "    server_name your-api-domain.com;"
echo ""
echo "    location / {"
echo "        proxy_pass http://localhost:8000;"
echo "        proxy_set_header Host \$host;"
echo "        proxy_set_header X-Real-IP \$remote_addr;"
echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
echo "        proxy_set_header X-Forwarded-Proto \$scheme;"
echo "    }"
echo "}"
echo ""
echo "For production deployment:"
echo "1. Consider using a process manager like systemd or supervisor to keep the backend running"
echo "2. Configure your web server with SSL/TLS for secure connections"
echo ""
echo "Thank you for using the Power Monitoring Application!" 