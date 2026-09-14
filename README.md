# GramSetu - AI-Based Village Complaint Management System

**GramSetu** is a production-quality, full-stack e-governance complaint management platform designed for Indian Gram Panchayats. It enables citizens to register local civic complaints with automatic AI classification and geospatial location pinning, provides field officers with load-balanced work queues and progress tracking tools, and provides Panchayat Admins with real-time analytics, geospatial heatmaps, SLA oversight, AI triage audits, and Excel/PDF reporting.

---

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Leaflet Maps, Lucide Icons
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0 ORM, Pydantic v2, PyJWT, Passlib (Bcrypt)
- **Database**: PostgreSQL 15 with Alembic migrations & automated seeding
- **Reporting**: OpenPyXL (Excel `.xlsx`), ReportLab (PDF)
- **Deployment**: Docker Compose (Multi-stage Nginx frontend + FastAPI backend + Postgres DB)

---

## Quick Start (Single Command Boot)

To run the entire system end-to-end with database migrations, seed data, and Nginx frontend serving:

```bash
docker compose up --build
```

Access the application in your browser:
- **Frontend Web Portal**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Demo Login Credentials

The database is automatically seeded on first boot with realistic test data across all roles:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Panchayat Admin** | `admin@gramsetu.in` | `admin123` | Full Sarpanch / Panchayat Secretary privileges |
| **Citizen (Rampur)** | `citizen1@gramsetu.in` | `citizen123` | Ramesh Chandra (Rampur Village) |
| **Citizen (Ananthapur)** | `citizen2@gramsetu.in` | `citizen23` | Laxmi Devi (Ananthapur Village) |
| **Water Officer A** | `officer.water1@gramsetu.in` | `officer123` | Water Dept, Rampur (1 active complaint) |
| **Water Officer B** | `officer.water2@gramsetu.in` | `officer123` | Water Dept, Rampur (0 active complaints - next assigned!) |
| **Electricity Officer A** | `officer.elec1@gramsetu.in` | `officer123` | Electricity Dept, Ananthapur (2 active complaints) |
| **Electricity Officer B** | `officer.elec2@gramsetu.in` | `officer123` | Electricity Dept, Ananthapur (0 active complaints) |
| **Roads Officer** | `officer.roads1@gramsetu.in` | `officer123` | PWD / Roads Dept, Chandanagar |
| **Sanitation Officer** | `officer.sanitation1@gramsetu.in` | `officer123` | Sanitation Dept, Rampur |

---

## Core System Features

1. **Automatic AI Triage & Classification**:
   - Keyword NLP analyzer computes urgency priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) and confidence score.
   - Detects duplicate complaints within the same village & category registered in the past 48h with geospatial proximity (<500m).
2. **Automated Load-Balanced Officer Assignment**:
   - Finds field officers belonging to the complaint's department and village.
   - Automatically assigns the complaint to the qualifying officer with the **minimum active workload**.
3. **Role-Based Access Control (Server-Side Enforced)**:
   - Citizens see only their own complaints and tracking timelines.
   - Officers see strictly complaints assigned to their ID.
   - Admin has full dispatch, SLA audit, and reporting controls.
4. **Geospatial Mapping & Heatmap**:
   - Leaflet interactive location picker for citizens.
   - Administrative visual heatmap filtering complaints by status and urgency.
5. **Real-time Exporting**:
   - Export filtered complaint logs directly as formatted `.xlsx` (OpenPyXL) and `.pdf` (ReportLab) files.
