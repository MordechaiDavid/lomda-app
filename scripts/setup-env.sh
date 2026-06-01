#!/bin/bash

# Setup script for local development

echo "🚀 Setting up Lomda App..."

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

echo "✅ Prerequisites checked"

# Setup environment
if [ ! -f .env ]; then
    echo "📋 Creating .env file..."
    cp docker/.env.example .env
    echo "⚠️  Please edit .env with your configuration"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Run migrations
echo "🔄 Running database migrations..."
npm run db:migrate

echo "✅ Setup complete!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:3001"
echo ""
echo "Start development with: npm run dev"
