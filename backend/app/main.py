import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import (
    auth, villages, departments, complaints, admin, notifications, reports
)

app = FastAPI(
    title="GramSetu API",
    description="AI-Based Village Complaint Management System API",
    version="1.0.0"
)

# CORS Middleware
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for complaint photo uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Router Registrations
app.include_router(auth.router, prefix="/api/v1")
app.include_router(villages.router, prefix="/api/v1")
app.include_router(departments.router, prefix="/api/v1")
app.include_router(complaints.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")

import threading

def run_async_db_init():
    print("Initializing database tables and seed data in background...")
    try:
        from alembic.config import Config
        from alembic import command
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        print("Alembic migrations applied successfully.")
    except Exception as e:
        print(f"Alembic migration warning/skip: {e}")
        try:
            from app.database import engine, Base
            import app.models  # noqa
            Base.metadata.create_all(bind=engine)
            print("Fallback Base.metadata.create_all executed.")
        except Exception as ex:
            print(f"Fallback create_all error: {ex}")

    try:
        from seed import seed_database
        seed_database()
        print("Database seeding completed.")
    except Exception as e:
        print(f"Database seed warning/skip: {e}")

@app.on_event("startup")
def startup_event():
    threading.Thread(target=run_async_db_init, daemon=True).start()

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "GramSetu Backend API"}

@app.get("/")
def root():
    return {"message": "Welcome to GramSetu API - AI Village Complaint System"}
