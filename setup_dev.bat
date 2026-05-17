@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM Greenpack Pro — Windows Development Setup Script
REM Run this ONCE to set up your development environment
REM Requirements: Python 3.11+, Node.js 20+
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo  ██████╗ ██████╗ ███████╗███████╗███╗   ██╗██████╗  █████╗  ██████╗██╗  ██╗
echo ██╔════╝ ██╔══██╗██╔════╝██╔════╝████╗  ██║██╔══██╗██╔══██╗██╔════╝██║ ██╔╝
echo ██║  ███╗██████╔╝█████╗  █████╗  ██╔██╗ ██║██████╔╝███████║██║     █████╔╝
echo ██║   ██║██╔══██╗██╔══╝  ██╔══╝  ██║╚██╗██║██╔═══╝ ██╔══██║██║     ██╔═██╗
echo ╚██████╔╝██║  ██║███████╗███████╗██║ ╚████║██║     ██║  ██║╚██████╗██║  ██╗
echo  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═══╝╚═╝     ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
echo                         PRO — Label Inspection System
echo.

echo [Step 1/6] Checking Python version...
python --version 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Download from https://python.org (3.11+^)
    pause && exit /b 1
)

echo [Step 2/6] Creating Python virtual environment...
cd /d "%~dp0backend"
if not exist "venv" (
    python -m venv venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

echo [Step 3/6] Installing Python dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies.
    pause && exit /b 1
)

echo [Step 4/6] Setting up configuration...
if not exist ".env" (
    copy .env.example .env
    echo Created .env from template. Edit it to customize settings.
) else (
    echo .env already exists.
)

echo [Step 5/6] Creating data directories...
mkdir data 2>nul
mkdir files 2>nul
mkdir reports 2>nul
mkdir templates 2>nul
mkdir models 2>nul
mkdir logs 2>nul
mkdir temp 2>nul
mkdir backups 2>nul

echo [Step 6/6] Installing Node.js dependencies (frontend)...
cd /d "%~dp0frontend"
npm install --silent
if %errorlevel% neq 0 (
    echo ERROR: npm install failed. Check Node.js is installed (v20+^).
    pause && exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════════════
echo  Setup Complete! 
echo.
echo  To start Greenpack Pro (development mode):
echo    run_dev.bat
echo.
echo  Default login: admin@greenpackpro.local / Admin123!
echo  API:           http://localhost:18080/api/docs
echo  Frontend:      http://localhost:5173
echo ═══════════════════════════════════════════════════════════════════
pause
