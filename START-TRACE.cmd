@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Please install Node.js 24 or newer, then run this file again.
  pause
  exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0]) < 24) process.exit(1)"
if errorlevel 1 (
  echo TRACE requires Node.js 24 or newer.
  pause
  exit /b 1
)
if not exist "node_modules\next\package.json" (
  call npm ci
  if errorlevel 1 exit /b 1
)
call npm run db:migrate
if errorlevel 1 exit /b 1
echo.
echo TRACE will be available at http://127.0.0.1:5173
echo Keep this window open while using the app. Press Ctrl+C to stop it.
echo.
start "" /b node scripts/open-browser-when-ready.mjs
call npm run dev
