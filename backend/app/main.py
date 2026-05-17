"""
Greenpack Pro — FastAPI Application Entry Point
"""
import uuid
import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.database import init_db, check_db_integrity, AsyncSessionLocal, get_db
from app.services.auth_service import create_access_token, hash_password, verify_password

# Import all routers
from app.routers import auth, users, jobs, templates, scanners, batch, reports, settings_router, multi_up, prepress

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

async def ensure_admin_user():
    """Ensure admin user exists in the database"""
    from app.models.base import User
    from sqlalchemy import text
    
    async with AsyncSessionLocal() as db:
        await db.execute(text("PRAGMA foreign_keys = OFF"))
        
        try:
            result = await db.execute(select(User).where(User.email == "admin@example.com"))
            admin = result.scalar_one_or_none()
            
            if not admin:
                log.info("Creating default admin user...")
                placeholder_company_id = "11111111-1111-1111-1111-111111111111"
                
                admin = User(
                    id=str(uuid.uuid4()),
                    company_id=placeholder_company_id,
                    email="admin@example.com",
                    password_hash=hash_password("Admin123!"),
                    full_name="Admin User",
                    role="admin",
                    active=True
                )
                db.add(admin)
                await db.commit()
                log.info("Default admin created: admin@example.com / Admin123!")
            else:
                log.info("Admin user already exists.")
        finally:
            await db.execute(text("PRAGMA foreign_keys = ON"))

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

# ── FastAPI App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Greenpack Pro API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://green-pack-pro.netlify.app",  # <-- ADD YOUR NETLIFY URL
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Models ────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

# ── Authentication Endpoint ────────────────────────────────────────────────────
@app.post("/api/v1/auth/login")
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    from app.models.base import User
    
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.password_hash):
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

# ── Health & Utility Endpoints ─────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": settings.greenpack_version}

@app.get("/api/v1/dashboard/stats")
async def dashboard_stats():
    return {"today_total": 0, "today_pass": 0, "today_fail": 0, "pass_rate": 0, "avg_score": 0}

# ── Include All Routers ────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
app.include_router(multi_up.router, prefix="/api/v1/jobs", tags=["Multi-Up"])
app.include_router(prepress.router, prefix="/api/v1/prepress", tags=["Prepress"])
app.include_router(templates.router, prefix="/api/v1/templates", tags=["Templates"])
app.include_router(scanners.router, prefix="/api/v1/scanners", tags=["Scanners"])
app.include_router(batch.router, prefix="/api/v1/batch", tags=["Batch"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(settings_router.router, prefix="/api/v1/settings", tags=["Settings"])

# ── Database Fix Endpoint ──────────────────────────────────────────────────────
@app.get("/fix-db")
async def fix_db():
    import sqlite3
    from app.services.auth_service import hash_password
    
    conn = sqlite3.connect('./data/greenpack.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(36) PRIMARY KEY,
            company_id VARCHAR(36),
            email VARCHAR(255) UNIQUE,
            password_hash TEXT,
            full_name VARCHAR(200),
            role VARCHAR(50),
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("DELETE FROM users WHERE email IN ('admin@greenpackpro.local', 'admin@example.com')")
    
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
    
    return {"message": "Database fixed! Use admin@example.com / Admin123!", "users": users}

# ── Serve Static Files ─────────────────────────────────────────────────────────
reports_dir = Path(settings.reports_dir)
reports_dir.mkdir(parents=True, exist_ok=True)
app.mount("/reports", StaticFiles(directory=str(reports_dir)), name="reports")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
