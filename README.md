# GramSetu - AI-Based Village Complaint Management System

**GramSetu** is a production-quality, full-stack e-governance complaint management platform designed for Indian Gram Panchayats. It enables citizens to register local civic grievances with automatic AI classification, custom problem reporting, and geospatial location pinning. It provides field officers with load-balanced work queues, SLA tracking, and status update tools, while granting Panchayat Admins real-time analytics, geospatial heatmaps, SLA oversight, AI triage audits, and Excel/PDF reporting.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Leaflet GIS Maps, Lucide Icons
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0 ORM, Pydantic v2, PyJWT, Passlib (Bcrypt)
- **Database**: PostgreSQL 15 / SQLite with Alembic migrations & automated seeding
- **Reporting & Exports**: OpenPyXL (Formatted Excel `.xlsx`), ReportLab (Document `.pdf`)
- **Containerization**: Docker Compose (Multi-stage Nginx frontend + FastAPI backend + Postgres DB)

---

## ⚡ Quick Start Options

### Option A: Docker Boot (Single Command)
Run the complete stack with Nginx, FastAPI, Postgres, database migrations, and seed data:

```bash
docker compose up --build
```
- **Frontend Web Portal**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Option B: Local Development Boot

**Backend Setup:**
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --port 8000
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```
- **Frontend Dev Server**: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Demo Login Credentials

The system comes pre-seeded with realistic test data across 11 West Godavari Panchayats:

| Role | Email | Password | Details & Village |
| :--- | :--- | :--- | :--- |
| **Panchayat Admin** | `admin@gramsetu.in` | `admin123` | Sarpanch & Executive Admin |
| **Citizen (Vempa)** | `citizen1@gramsetu.in` | `citizen123` | Ramesh Chandra (Vempa Village) |
| **Citizen (Anakoderu)** | `citizen2@gramsetu.in` | `citizen23` | Laxmi Devi (Anakoderu Village) |
| **Water Officer A** | `officer.water1@gramsetu.in` | `officer123` | Water Dept, Vempa |
| **Water Officer B** | `officer.water2@gramsetu.in` | `officer123` | Water Dept, Vempa (Load-Balanced Next) |
| **Electricity Officer A** | `officer.elec1@gramsetu.in` | `officer123` | Electricity Dept, Anakoderu |
| **Electricity Officer B** | `officer.elec2@gramsetu.in` | `officer23` | Electricity Dept, Anakoderu |
| **Roads Officer** | `officer.roads1@gramsetu.in` | `officer123` | PWD / Roads Dept, Bethapudi |
| **Sanitation Officer** | `officer.sanitation1@gramsetu.in` | `officer123` | Sanitation Dept, Vempa |

---

## ✨ Key System Features

1. **Automatic AI Triage & Classification**:
   - Keyword NLP analyzer computes priority level (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) and AI confidence score.
   - Detects duplicate complaints within the same village & category registered in the past 48 hours within geospatial proximity (<500m).

2. **Automated Load-Balanced Officer Assignment**:
   - Identifies qualifying field officers matching the complaint's department and village.
   - Auto-assigns the complaint to the officer with the **minimum active workload**.

3. **Custom Category & Problem Registration**:
   - Allows citizens to select **`➕ Others / Unlisted Category`** and specify custom civic problems via a dynamic text input field.
   - Searchable village selection supporting unlisted village entries and GPS reverse-geocoding.

4. **Role-Tailored Portals & Security**:
   - **Citizen Portal**: Register complaints, upload photo proof, pin map locations, and track resolution timelines.
   - **Field Officer Portal**: View assigned workload queue, SLA countdown timers, and submit resolution proof. Clean login interface excluding non-relevant registration links.
   - **Admin Portal**: Executive overview, geospatial heatmap GIS view, AI priority audits, and SLA override controls.

5. **Geospatial GIS Heatmap & Exports**:
   - Interactive Leaflet map with priority-colored pins and density heatmaps.
   - Formatted Excel (`.xlsx`) and PDF report exports for Panchayat meetings.
