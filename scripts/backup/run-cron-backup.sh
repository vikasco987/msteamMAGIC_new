#!/bin/bash

# Configuration - Auto detect project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Log file path - check if writable, else use /tmp
LOG_FILE="$PROJECT_DIR/scripts/backup/backup.log"
touch "$LOG_FILE" 2>/dev/null
if [ $? -ne 0 ]; then
    LOG_FILE="/tmp/backup.log"
fi

# Add standard paths for Mac/Linux
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# If using NVM, try to load it
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Navigate to project directory
cd "$PROJECT_DIR"

echo "------------------------------------------" >> "$LOG_FILE"
echo "📅 Backup started at: $(date)" >> "$LOG_FILE"
echo "📂 Project Dir: $PROJECT_DIR" >> "$LOG_FILE"
echo "📝 Using Log File: $LOG_FILE" >> "$LOG_FILE"

# Run the backup script using npm
# We use 'node' directly to be safer about which script we run
export NODE_ENV=production
node "$PROJECT_DIR/scripts/backup/mongodb-backup.js" >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Backup process finished successfully." >> "$LOG_FILE"
else
    echo "❌ Backup process failed. Check the logs above." >> "$LOG_FILE"
fi

echo "🕒 Finished at: $(date)" >> "$LOG_FILE"
echo "------------------------------------------" >> "$LOG_FILE"
