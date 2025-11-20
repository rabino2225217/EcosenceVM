#!/bin/bash

# EcoSense VM Deployment Script
# This script sets up the EcoSense application on a VM

set -e

echo "=========================================="
echo "EcoSense VM Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${YELLOW}Warning: Running as root. Consider using a non-root user with sudo.${NC}"
fi

# Check for Docker
echo -e "\n${GREEN}[1/6]${NC} Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}Docker installed. Please log out and log back in for group changes to take effect.${NC}"
    exit 0
else
    echo -e "${GREEN}Docker is already installed.${NC}"
fi

# Check for Docker Compose
echo -e "\n${GREEN}[2/6]${NC} Checking Docker Compose installation..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Installing...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose installed.${NC}"
else
    echo -e "${GREEN}Docker Compose is already installed.${NC}"
fi

# Check for .env files in each service directory
echo -e "\n${GREEN}[3/6]${NC} Checking environment configuration..."
ENV_FILES_MISSING=0

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}Warning: frontend/.env file not found.${NC}"
    ENV_FILES_MISSING=1
else
    echo -e "${GREEN}frontend/.env found.${NC}"
fi

if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}Warning: server/.env file not found.${NC}"
    ENV_FILES_MISSING=1
else
    echo -e "${GREEN}server/.env found.${NC}"
fi

if [ ! -f "model/.env" ]; then
    echo -e "${YELLOW}Warning: model/.env file not found.${NC}"
    ENV_FILES_MISSING=1
else
    echo -e "${GREEN}model/.env found.${NC}"
fi

if [ $ENV_FILES_MISSING -eq 1 ]; then
    echo -e "${YELLOW}Some .env files are missing. Please ensure all service .env files are configured:${NC}"
    echo "  - frontend/.env (should contain VITE_API_URL, etc.)"
    echo "  - server/.env (should contain MONGODB_URI, CLIENT_ORIGIN, SESSION_SECRET, etc.)"
    echo "  - model/.env (should contain MODEL_TREE_PATH, MODEL_CROP_PATH, MAX_FILE_SIZE_MB, etc.)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for model files
echo -e "\n${GREEN}[4/6]${NC} Checking model files..."
if [ ! -f "model/models/tree_model.pt" ] || [ ! -f "model/models/crop_model.pt" ]; then
    echo -e "${YELLOW}Warning: Model files not found in model/models/ directory.${NC}"
    echo -e "${YELLOW}Please ensure tree_model.pt and crop_model.pt are present.${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}Model files found.${NC}"
fi

# Create necessary directories
echo -e "\n${GREEN}[5/6]${NC} Creating necessary directories..."
mkdir -p server/uploads/temp
mkdir -p model/models
chmod -R 755 server/uploads
echo -e "${GREEN}Directories created.${NC}"

# Build and start services
echo -e "\n${GREEN}[6/6]${NC} Building and starting services..."
echo -e "${YELLOW}This may take several minutes...${NC}"

# Stop existing containers if running
docker compose down 2>/dev/null || true

# Build and start
docker compose up --build -d

# Wait for services to be healthy
echo -e "\n${GREEN}Waiting for services to start...${NC}"
sleep 10

# Check service status
echo -e "\n${GREEN}Service Status:${NC}"
docker compose ps

# Display access information
echo -e "\n${GREEN}=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo -e "${NC}"
echo "Services are now running:"
echo "  - Frontend: http://$(hostname -I | awk '{print $1}'):${FRONTEND_PORT:-5173}"
echo "  - API Server: http://$(hostname -I | awk '{print $1}'):${SERVER_PORT:-4000}"
echo "  - Model Service: http://$(hostname -I | awk '{print $1}'):${MODEL_PORT:-5001}"
echo ""
echo "Useful commands:"
echo "  - View logs: docker compose logs -f"
echo "  - Stop services: docker compose down"
echo "  - Restart services: docker compose restart"
echo "  - Update services: docker compose up --build -d"
echo ""
echo -e "${YELLOW}Note: Make sure your firewall allows traffic on ports ${FRONTEND_PORT:-5173}, ${SERVER_PORT:-4000}, and ${MODEL_PORT:-5001}${NC}"
echo -e "${GREEN}==========================================${NC}"

