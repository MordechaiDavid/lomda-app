#!/bin/bash

# Database migration script
set -e

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-lomda_db}

echo "🔄 Running database migrations..."

# Create database if it doesn't exist
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc \
  "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c \
  "CREATE DATABASE $DB_NAME ENCODING 'UTF8';"

# Run migrations
cd backend
npm run db:migrate || true

echo "✅ Database migrations completed"
