#!/bin/sh
# Run Prisma db push to sync schema directly
echo "Running Prisma db push..."
npx --yes prisma@5.22.0 db push --accept-data-loss --skip-generate


# Start the Next.js application
echo "Starting Next.js..."
exec "$@"
