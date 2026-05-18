# ── FastAPI App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Greenpack Pro API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ✅ CORS - Allow all origins (fix for Netlify + Render)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ FIX 2: Remove the custom ForceCORSHeaders middleware (not needed with proper CORS)

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

# ✅ FIX 3: FIX ROUTE CONFLICTS - Use proper prefixes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
# ✅ Fix: Multi-up uses a sub-path under jobs
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
@app.get("/fix-audit-logs-foreign-key")
async def fix_audit_logs_foreign_key():
    import sqlite3
    
    conn = sqlite3.connect('./data/greenpack.db')
    cursor = conn.cursor()
    
    # Drop and recreate audit_logs without foreign key constraint
    cursor.execute("DROP TABLE IF EXISTS audit_logs")
    cursor.execute("""
        CREATE TABLE audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id VARCHAR(36),
            user_id VARCHAR(36),
            action VARCHAR(100),
            resource_type VARCHAR(50),
            resource_id VARCHAR(36),
            ip_address VARCHAR(45),
            details TEXT,
            created_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id)
            -- Removed company_id foreign key constraint
        )
    """)
    
    conn.commit()
    conn.close()
    
    return {"message": "audit_logs table recreated without company_id foreign key"}

# ✅ ALSO ADD THIS COMPREHENSIVE FIX (recommended)
@app.get("/fix-all-db-issues")
async def fix_all_db_issues():
    import sqlite3
    
    conn = sqlite3.connect('./data/greenpack.db')
    cursor = conn.cursor()
    
    # 1. Create companies table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS companies (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(200),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 2. Insert placeholder company
    placeholder_id = "11111111-1111-1111-1111-111111111111"
    cursor.execute(
        "INSERT OR IGNORE INTO companies (id, name) VALUES (?, ?)",
        (placeholder_id, "Default Company")
    )
    
    # 3. Fix audit_logs - drop and recreate properly
    cursor.execute("DROP TABLE IF EXISTS audit_logs")
    cursor.execute("""
        CREATE TABLE audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id VARCHAR(36),
            user_id VARCHAR(36),
            action VARCHAR(100),
            resource_type VARCHAR(50),
            resource_id VARCHAR(36),
            ip_address VARCHAR(45),
            details TEXT,
            created_at DATETIME,
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    conn.commit()
    conn.close()
    
    return {"message": "All database issues fixed!"}
# ── Serve Static Files ─────────────────────────────────────────────────────────
reports_dir = Path(settings.reports_dir)
reports_dir.mkdir(parents=True, exist_ok=True)
app.mount("/reports", StaticFiles(directory=str(reports_dir)), name="reports")

@app.get("/fix-audit-logs")
async def fix_audit_logs():
    import sqlite3
    conn = sqlite3.connect('./data/greenpack.db')
    cursor = conn.cursor()
    
    # Drop the problematic table
    cursor.execute("DROP TABLE IF EXISTS audit_logs")
    
    conn.commit()
    conn.close()
    
    return {"message": "audit_logs table dropped. It will be recreated with correct schema on next restart."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
