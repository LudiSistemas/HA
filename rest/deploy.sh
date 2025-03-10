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

# Build frontend
echo ""
echo "Building frontend..."
cd frontend
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

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "Please edit the .env file with your Home Assistant URL and token."
  echo "You can open it with: nano .env"
fi

# Create data directory if it doesn't exist
mkdir -p data

echo ""
echo "Deployment preparation complete!"
echo ""
echo "To start the application:"
echo "1. Make sure your .env file is configured correctly"
echo "2. Run the backend server:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   uvicorn main:app --host 0.0.0.0 --port 8000"
echo ""
echo "For production deployment:"
echo "1. Configure a web server (nginx, Apache) to serve the frontend build files"
echo "2. Set up a reverse proxy to the backend API"
echo "3. Consider using a process manager like systemd or supervisor to keep the backend running"
echo ""
echo "Thank you for using the Power Monitoring Application!" 