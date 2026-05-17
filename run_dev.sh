#!/bin/bash
# Greenpack Pro — Linux/macOS Development Runner
# Used for CI testing and development on non-Windows machines

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🏭 Greenpack Pro — Development Mode"
echo ""

# Backend setup
echo "📦 Setting up Python backend..."
cd "$SCRIPT_DIR/backend"

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

source venv/bin/activate

pip install -r requirements.txt -q 2>&1 | tail -5

# Create directories
mkdir -p data files reports templates models logs temp backups

# Copy env if not exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    # Override for local development
    sed -i 's|TESSERACT_PATH=.*|TESSERACT_PATH=tesseract|g' .env
    sed -i 's|EASYOCR_DOWNLOAD_ENABLED=false|EASYOCR_DOWNLOAD_ENABLED=true|g' .env
    echo "✅ .env created (edit for your environment)"
fi

echo ""
echo "✅ Backend ready"
echo ""

# Function to start backend
start_backend() {
    echo "🚀 Starting FastAPI backend on port 18080..."
    python -m app.main &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting Vite frontend on port 5173..."
    cd "$SCRIPT_DIR/frontend"
    npm install -q 2>&1 | tail -3
    npm run dev &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
}

# Cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

start_backend
sleep 3
start_frontend

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🌐 API:      http://localhost:18080"
echo "  📱 Frontend: http://localhost:5173"
echo "  📚 API Docs: http://localhost:18080/api/docs"
echo "  🔑 Login:    admin@greenpackpro.local / Admin123!"
echo "═══════════════════════════════════════════════════════════"
echo "Press Ctrl+C to stop"
echo ""

# Wait for processes
wait
