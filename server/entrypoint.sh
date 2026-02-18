#!/bin/sh
set -e

echo "🔄 Syncing database schema..."
npx prisma db push --accept-data-loss --skip-generate
echo "✅ Database schema synced"

echo "🚀 Starting server..."
exec node dist/index.js
