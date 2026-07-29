#!/bin/sh
set -e

echo "Waiting for database..."
# Prisma migrate deploy retries briefly if Postgres is still warming up
i=0
until npx prisma migrate deploy; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "Database migration failed after retries"
    exit 1
  fi
  echo "Migration attempt $i failed — retrying in 2s..."
  sleep 2
done

echo "Starting API server..."
exec node dist/server.js
