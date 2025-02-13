#!/bin/bash

# Set initial state
CHANGES_DETECTED=false
NGINX_CHANGED=false
FRONTEND_CHANGED=false

# Function to check nginx configuration
check_and_reload_nginx() {
    echo "Testing Nginx configuration..."
    sudo nginx -t
    if [ $? -eq 0 ]; then
        echo "Nginx configuration test successful, reloading..."
        sudo systemctl reload nginx
    else
        echo "Nginx configuration test failed! Aborting..."
        exit 1
    fi
}

# Function to build frontend
build_frontend() {
    echo "Building frontend..."
    cd frontend/weather-webapp
    npm run build
    cd ../..
}

# Pull latest changes and check what changed
git fetch
CHANGES=$(git diff HEAD..origin/dev --name-only)

if [ -n "$CHANGES" ]; then
    CHANGES_DETECTED=true
    echo "Changes detected in the following files:"
    echo "$CHANGES"
    
    # Check for nginx changes
    if echo "$CHANGES" | grep -q "nginx/"; then
        NGINX_CHANGED=true
    fi
    
    # Check for frontend changes
    if echo "$CHANGES" | grep -q "frontend/weather-webapp/"; then
        FRONTEND_CHANGED=true
    fi
    
    # Pull changes
    git pull
    
    # Handle nginx changes
    if [ "$NGINX_CHANGED" = true ]; then
        check_and_reload_nginx
    fi
    
    # Handle frontend changes
    if [ "$FRONTEND_CHANGED" = true ]; then
        build_frontend
    fi
else
    echo "No changes detected"
fi
