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

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "GramSetu Backend API"}

@app.get("/")
def root():
    return {"message": "Welcome to GramSetu API - AI Village Complaint System"}
