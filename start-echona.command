#!/bin/bash
# Move to the script's directory
cd "$(dirname "$0")"

echo "🏴‍☠️ Hoisting the colors! Starting Echona 2K26..."

# 0. Ensure Database is Running (Fix for "Can't reach database server" on Mac restarts)
echo "-> Checking PostgreSQL Database..."
brew services start postgresql@15 2>/dev/null
sleep 2

# 1. Start Realtime Service
echo "-> Booting WebSocket Server (Port 3001)..."
cd realtime-service
npm run dev &
REALTIME_PID=$!
cd ..

# 2. Start Next.js Web Frontend
echo "-> Booting Next.js Web App (Port 3000)..."
cd web
npm run dev &
WEB_PID=$!

# 3. Start Prisma Studio
echo "-> Booting Prisma Studio (Port 5555)..."
npx prisma studio &
PRISMA_PID=$!
cd ..

echo ""
echo "========================================================"
echo "⛵ THE BLACK PEARL SAILS AGAIN!"
echo "-> Web Interface: http://localhost:3000"
echo "-> WebSocket API: http://localhost:3001"
echo "-> Prisma DB UI:  http://localhost:5555"
echo "========================================================"
echo "Press [CTRL+C] to drop anchor (safely stop all services)."
echo ""

# Trap Ctrl+C to kill all background processes gracefully
trap "echo 'Dropping anchor... Stopping all pirate services...'; kill $REALTIME_PID $WEB_PID $PRISMA_PID 2>/dev/null; exit" SIGINT SIGTERM EXIT

# Keep script running while background tasks are active
wait
