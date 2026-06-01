#!/bin/bash

# Build Docker images for production
docker build -t lomda/backend:latest -f docker/Dockerfile.backend backend/
docker build -t lomda/frontend:latest -f docker/Dockerfile.frontend frontend/

echo "✅ Docker images built successfully"
echo ""
echo "To push images to registry:"
echo "docker push lomda/backend:latest"
echo "docker push lomda/frontend:latest"
