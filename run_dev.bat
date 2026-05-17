@echo off
REM Greenpack Pro — Development Runner
REM Starts backend API + frontend dev server simultaneously

echo Starting Greenpack Pro (Development Mode)...
echo.

REM Start backend in new window
start "Greenpack Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate.bat && python -m app.main"

REM Wait 3s for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend dev server in new window
start "Greenpack Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Backend API:  http://localhost:18080
echo Frontend UI:  http://localhost:5173
echo API Docs:     http://localhost:18080/api/docs
echo.
echo Login: admin@greenpackpro.local / Admin123!
echo.
echo Press any key to open the app in your browser...
pause >nul

start http://localhost:5173
