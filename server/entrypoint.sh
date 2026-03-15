#!/bin/sh
set -e

echo "⏳ Syncing database schema..."

echo "🚀 Starting server..."
exec node dist/index.js
