#!/bin/bash

# Deployment Script untuk Aplikasi Absensi Sekolah
# Usage: ./deploy.sh [production|staging]

set -e

# Configuration
APP_NAME="absensi-app"
APP_DIR="/var/www/absensi"
BACKUP_DIR="/var/backups/absensi"
LOG_DIR="/var/log/absensi"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root!"
   exit 1
fi

# Environment
ENVIRONMENT=${1:-production}
print_status "Deploying to $ENVIRONMENT environment"

# Create necessary directories
print_status "Creating directories..."
sudo mkdir -p $APP_DIR $BACKUP_DIR $LOG_DIR
sudo chown $USER:$USER $APP_DIR $BACKUP_DIR $LOG_DIR

# Navigate to app directory
cd $APP_DIR

# Backup current version
if [ -d "current" ]; then
    print_status "Backing up current version..."
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    cp -r current $BACKUP_DIR/$BACKUP_NAME
    tar -czf $BACKUP_DIR/$BACKUP_NAME.tar.gz -C $BACKUP_DIR $BACKUP_NAME
    rm -rf $BACKUP_DIR/$BACKUP_NAME
    print_status "Backup created: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
fi

# Clone or pull latest code
if [ ! -d "repo" ]; then
    print_status "Cloning repository..."
    git clone https://github.com/username/absensi-alfatahtalun.git repo
else
    print_status "Pulling latest changes..."
    cd repo
    git pull origin main
    cd ..
fi

# Copy to new release directory
RELEASE_DIR="release_$(date +%Y%m%d_%H%M%S)"
cp -r repo $RELEASE_DIR
cd $RELEASE_DIR

# Install dependencies
print_status "Installing dependencies..."
npm ci --production=false

# Build application
print_status "Building application..."
npm run build

# Database migrations
print_status "Running database migrations..."
npx drizzle-kit push

# Update symlink
print_status "Updating symlink to new release..."
cd $APP_DIR
ln -sfn $RELEASE_DIR current

# Restart application with PM2
print_status "Restarting application..."
cd current
pm2 reload $APP_NAME || pm2 start ecosystem.config.js

# Health check
print_status "Performing health check..."
sleep 5
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status "Application is healthy!"
else
    print_error "Health check failed! Rolling back..."
    # Rollback logic here
    exit 1
fi

# Cleanup old releases (keep last 3)
print_status "Cleaning up old releases..."
ls -t | grep 'release_' | tail -n +4 | xargs -r rm -rf

print_status "Deployment completed successfully!"
print_status "Application running at: http://localhost:3000"

# Show PM2 status
pm2 status
