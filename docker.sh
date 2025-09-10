#!/bin/bash

# SMTP Sandbox Docker Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to build the image
build() {
    print_info "Building SMTP Sandbox Docker image..."
    docker-compose build
    print_success "Image built successfully!"
}

# Function to start the services
start() {
    print_info "Starting SMTP Sandbox services..."
    docker-compose up -d
    print_success "Services started successfully!"
    print_info "Web interface: http://localhost:3000"
    print_info "SMTP server: localhost:2525"
}

# Function to stop the services
stop() {
    print_info "Stopping SMTP Sandbox services..."
    docker-compose down
    print_success "Services stopped successfully!"
}

# Function to restart the services
restart() {
    print_info "Restarting SMTP Sandbox services..."
    docker-compose restart
    print_success "Services restarted successfully!"
}

# Function to show logs
logs() {
    print_info "Showing SMTP Sandbox logs..."
    docker-compose logs -f
}

# Function to show status
status() {
    print_info "SMTP Sandbox status:"
    docker-compose ps
}

# Function to clean up
clean() {
    print_warning "This will remove all containers, images, and volumes related to SMTP Sandbox."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleaning up..."
        docker-compose down -v --rmi all
        print_success "Cleanup completed!"
    else
        print_info "Cleanup cancelled."
    fi
}

# Function to backup database
backup() {
    print_info "Creating database backup..."
    BACKUP_FILE="emails_backup_$(date +%Y%m%d_%H%M%S).db"
    docker-compose exec smtp-sandbox cp /app/data/emails.db /app/data/$BACKUP_FILE
    docker cp smtp-sandbox:/app/data/$BACKUP_FILE ./
    print_success "Database backed up to $BACKUP_FILE"
}

# Function to show help
help() {
    echo "SMTP Sandbox Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build     Build the Docker image"
    echo "  start     Start the services"
    echo "  stop      Stop the services"
    echo "  restart   Restart the services"
    echo "  logs      Show service logs"
    echo "  status    Show service status"
    echo "  backup    Backup the database"
    echo "  clean     Remove all containers, images, and volumes"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build && $0 start"
    echo "  $0 logs"
    echo "  $0 backup"
}

# Main script logic
check_docker

case "${1:-help}" in
    build)
        build
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    backup)
        backup
        ;;
    clean)
        clean
        ;;
    help|--help|-h)
        help
        ;;
    *)
        print_error "Unknown command: $1"
        help
        exit 1
        ;;
esac
