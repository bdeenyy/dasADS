#!/bin/sh
# Run Prisma migrations
echo "Running Prisma migrations..."
npx --yes prisma migrate deploy


# Start the Next.js application
echo "Starting Next.js..."
exec "$@"
