@echo off
setlocal
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js 20 LTS from https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing project packages. This only happens once...
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
call npm run dev
