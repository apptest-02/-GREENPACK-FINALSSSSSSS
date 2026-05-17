"""
Greenpack Pro — FastAPI Application Entry Point
"""
import uuid
import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.database import init_db, check_db_integrity, get_db
from app.services.auth_service import create_access_token, hash_password, verify_password
from app.models.base import User

log = logging.getLogger(__name__)
settings = get_settings()

# ── Configure Logging ──────────────────────────────────────────────────────────
def setup_logging():
    log_dir = Path(settings.log_file).parent
    log_dir.mkdir(parents=True, exist_ok=True)
    handlers = [logging.StreamHandler(sys.stdout)]
    try:
        from logging.handlers import RotatingFileHandler
        handlers.append(
            RotatingFileHandler(
                settings.log_file,
                maxBytes=10 * 1024 * 1024,
                backupCount=5,
                encoding="utf-8",
            )
        )
    except Exception:
        pass
    logging.basicConfig(
        level=getattr(logging, settings.log_level, logging.INFO),
        format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
        handlers=handlers,
    )

setup_logging()

# ── Startup/Shutdown ───────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("=" * 60)
    log.info(f"Greenpack Pro v{settings.greenpack_version} starting")
    log.info(f"Database: {settings.db_url[:50]}...")
    
    settings.ensure_directories()
    await init_db()
    await ensure_admin_user()
    
    log.info("=" * 60)
    yield
    log.info("Greenpack Pro shutting down")

async def ensure_admin_user():
    """Ensure admin user exists"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "admin@example.com"))
        user = result.scalar_one_or_none()
        if not user:
            from app.services.auth_service import hash_password
            admin = User(
                id=str(uuid.uuid4()),
                company_id=str(uuid.uuid4()),
                email="admin@example.com",
                password_hash=hash_password("Admin123!"),
                full_name="Admin User",
                role="admin",
                active=True
            )
            db.add(admin)
            await db.commit()
            log.info("Admin user created: admin@example.com / Admin123!")

# ── FastAPI App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Greenpack Pro API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS - Allow all origins for testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Login Models ────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

# ── Login Endpoint ─────────────────────────────────────────────────────────────
@app.post("/api/v1/auth/login")
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login endpoint - returns JWT token"""
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name
    }

# ── Health Check ────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": settings.greenpack_version}

# ── Dashboard Stats ────────────────────────────────────────────────────────────
@app.get("/api/v1/dashboard/stats")
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    return {
        "today_total": 0,
        "today_pass": 0,
        "today_fail": 0,
        "pass_rate": 0,
        "avg_score": 0,
    }

# ── Test endpoints ─────────────────────────────────────────────────────────────
@app.get("/api/v1/jobs")
async def get_jobs():
    return []

@app.get("/api/v1/templates")
async def get_templates():
    return []

@app.get("/api/v1/scanners")
async def get_scanners():
    return []

# ── Fix Database Endpoint ─────────────────────────────────────────────────────
@app.get("/fix-db")
async def fix_db():
    """Fix database - create admin user"""
    import sqlite3
    conn = sqlite3.connect('./data/greenpack.db')
    cursor = conn.cursor()
    
    # Check if users table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        return {"error": "Users table doesn't exist. Restart the service."}
    
    # Delete existing admin and recreate
    cursor.execute("DELETE FROM users WHERE email LIKE '%greenpack%'")
    cursor.execute("DELETE FROM users WHERE email = 'admin@example.com'")
    
    # Insert admin user
    user_id = str(uuid.uuid4())
    company_id = str(uuid.uuid4())
    password_hash = hash_password("Admin123!")
    
    cursor.execute(
        "INSERT INTO users (id, company_id, email, password_hash, full_name, role, active) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (user_id, company_id, "admin@example.com", password_hash, "Admin User", "admin", 1)
    )
    
    conn.commit()
    cursor.execute("SELECT email, role FROM users")
    users = cursor.fetchall()
    conn.close()
    
    return {"message": "Admin created! Use admin@example.com / Admin123!", "users": users}

# ── Serve static files ─────────────────────────────────────────────────────────
reports_dir = Path(settings.reports_dir)
reports_dir.mkdir(parents=True, exist_ok=True)
app.mount("/reports", StaticFiles(directory=str(reports_dir)), name="reports")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
