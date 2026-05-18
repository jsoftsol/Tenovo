#!/bin/bash
set -euo pipefail

if [ -z "${APP_DIR:-}" ]; then
  echo "APP_DIR is missing."
  exit 1
fi

if [ -z "${PRODUCTION_ENV:-}" ]; then
  echo "PRODUCTION_ENV is missing."
  exit 1
fi

cd "$APP_DIR"

echo "Pulling latest code..."
git pull origin deploy

echo "Writing production environment..."
printf "%s" "$PRODUCTION_ENV" > .env.production
chmod 600 .env.production

echo "Building and starting Docker services..."
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

echo "Running Prisma production migrations..."
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T app npx prisma migrate deploy

echo "Pruning unused Docker images..."
docker image prune -f

echo "Deployment complete."