#!/bin/bash

# Configuration
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_FILE="$SCRIPT_DIR/../dev.db" 
BACKUP_DIR="$SCRIPT_DIR/../backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/database_$TIMESTAMP.bak"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Perform backup using sqlite3 if available, otherwise simple copy
if command -v sqlite3 &> /dev/null
then
    echo "📦 Creating secure SQLite backup..."
    sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"
else
    echo "⚠️ sqlite3 not found, performing simple file copy..."
    cp "$DB_FILE" "$BACKUP_FILE"
fi

echo "✅ Backup completed: $BACKUP_FILE"

# Keep only the last 7 days of backups
find "$BACKUP_DIR" -name "*.bak" -mtime +7 -delete
echo "🧹 Old backups cleaned up."
