@echo off
title Echona 2K26 - Pirate Code Championship Launcher
echo ========================================================
echo 🏴‍☠️ HOISTING THE COLORS! STARTING ECHONA 2K26...
echo ========================================================
echo.

echo - Booting Realtime WebSocket Service (Port 3001)...
start "Echona Realtime Service" cmd /k "cd realtime-service && npm run dev"

echo - Booting Next.js Web App (Port 3000)...
start "Echona Web Interface" cmd /k "cd web && npm run dev"

echo - Booting Prisma Studio (Port 5555)...
start "Echona Prisma DB" cmd /k "cd web && npx prisma studio"

echo.
echo ========================================================
echo ⛵ THE BLACK PEARL SAILS AGAIN!
echo.
echo The servers are launching in 3 separate windows.
echo - Web Interface: http://localhost:3000
echo - WebSocket API: http://localhost:3001
echo - Prisma DB UI:  http://localhost:5555
echo ========================================================
echo.
echo You can safely close this launcher window. 
echo To stop the servers later, just close their respective command prompt windows.
echo.
pause
