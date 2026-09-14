from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import (
    User, UserRole, Complaint, ComplaintStatus, PriorityLevel, Department, Village, Category,
    ComplaintStatusHistory, Notification
)
from app.schemas import (
    AdminDashboardStats, DepartmentSLAStats, ReassignComplaintRequest, TriageOverrideRequest,
    UserCreate, UserResponse
)
from app.auth import require_roles, get_password_hash
from app.routers.complaints import format_complaint_response

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_roles([UserRole.ADMIN]))])

@router.get("/stats", response_model=AdminDashboardStats)
def get_admin_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Complaint.id)).scalar() or 0
    resolved = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.RESOLVED).scalar() or 0
    pending = db.query(func.count(Complaint.id)).filter(Complaint.status.in_([ComplaintStatus.SUBMITTED, ComplaintStatus.ASSIGNED])).scalar() or 0
    rejected = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.REJECTED).scalar() or 0
    in_progress = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.IN_PROGRESS).scalar() or 0
    urgent = db.query(func.count(Complaint.id)).filter(Complaint.priority == PriorityLevel.URGENT, Complaint.status != ComplaintStatus.RESOLVED).scalar() or 0

    res_rate = (resolved / total * 100.0) if total > 0 else 0.0

    # Calculate average resolution time for RESOLVED complaints
    resolved_complaints = db.query(Complaint).filter(Complaint.status == ComplaintStatus.RESOLVED).all()
    total_hours = 0.0
    count_resolved_with_time = 0
    for c in resolved_complaints:
        if c.created_at and c.updated_at:
            delta = c.updated_at - c.created_at
            total_hours += delta.total_seconds() / 3600.0
            count_resolved_with_time += 1
            
    avg_res_time = (total_hours / count_resolved_with_time) if count_resolved_with_time > 0 else 0.0

    return {
        "total_complaints": total,
        "resolved_complaints": resolved,
        "pending_complaints": pending,
        "rejected_complaints": rejected,
        "in_progress_complaints": in_progress,
        "resolution_rate_pct": round(res_rate, 1),
        "avg_resolution_time_hours": round(avg_res_time, 1),
        "urgent_complaints_count": urgent
    }

@router.get("/sla", response_model=List[DepartmentSLAStats])
def get_department_sla(db: Session = Depends(get_db)):
    departments = db.query(Department).all()
    results = []
    now = datetime.utcnow()
    overdue_cutoff = now - timedelta(hours=48)

    for dept in departments:
        # Get category IDs belonging to this department
        cat_ids = [c.id for c in dept.categories]
        dept_complaints = db.query(Complaint).filter(Complaint.category_id.in_(cat_ids)).all() if cat_ids else []

        total_assigned = len(dept_complaints)
        resolved = sum(1 for c in dept_complaints if c.status == ComplaintStatus.RESOLVED)
        pending = sum(1 for c in dept_complaints if c.status in [ComplaintStatus.SUBMITTED, ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS])
        overdue = sum(1 for c in dept_complaints if c.status != ComplaintStatus.RESOLVED and c.status != ComplaintStatus.REJECTED and c.created_at <= overdue_cutoff)

        res_hours = []
        for c in dept_complaints:
            if c.status == ComplaintStatus.RESOLVED and c.created_at and c.updated_at:
                res_hours.append((c.updated_at - c.created_at).total_seconds() / 3600.0)

        avg_hours = (sum(res_hours) / len(res_hours)) if res_hours else 0.0

        results.append({
            "department_id": dept.id,
            "department_name": dept.name,
            "total_assigned": total_assigned,
            "resolved": resolved,
            "pending": pending,
            "avg_resolution_hours": round(avg_hours, 1),
            "overdue_count": overdue
        })

    return results

@router.get("/heatmap")
def get_heatmap_data(db: Session = Depends(get_db)):
    complaints = db.query(Complaint).filter(Complaint.latitude.isnot(None), Complaint.longitude.isnot(None)).all()
    return [
        {
            "id": c.id,
            "reference_id": c.reference_id,
            "title": c.title,
            "category": c.category.name if c.category else "General",
            "priority": c.priority.value,
            "status": c.status.value,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "village_name": c.village.name if c.village else ""
        } for c in complaints
    ]

@router.post("/complaints/{complaint_id}/reassign")
def reassign_complaint(
    complaint_id: int,
    req: ReassignComplaintRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    officer = db.query(User).filter(User.id == req.assigned_officer_id, User.role == UserRole.OFFICER).first()
    if not officer:
        raise HTTPException(status_code=400, detail="Target officer not found or is not an officer")

    old_officer_name = c.assigned_officer.name if c.assigned_officer else "None"
    c.assigned_officer_id = officer.id
    c.status = ComplaintStatus.ASSIGNED
    c.updated_at = datetime.utcnow()

    # History log
    hist = ComplaintStatusHistory(
        complaint_id=c.id,
        status=ComplaintStatus.ASSIGNED,
        note=f"Reassigned by Admin from {old_officer_name} to {officer.name}." + (f" Reason: {req.reason}" if req.reason else ""),
        changed_by_user_id=current_user.id
    )
    db.add(hist)

    # Notify new officer & citizen
    db.add(Notification(
        user_id=officer.id,
        complaint_id=c.id,
        message=f"Complaint {c.reference_id} reassigned to you by Panchayat Admin."
    ))
    db.add(Notification(
        user_id=c.citizen_id,
        complaint_id=c.id,
        message=f"Complaint {c.reference_id} reassigned to Field Officer {officer.name}."
    ))

    db.commit()
    db.refresh(c)
    return format_complaint_response(c)

@router.post("/complaints/{complaint_id}/triage-override")
def override_ai_triage(
    complaint_id: int,
    req: TriageOverrideRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    changes = []
    if req.priority:
        changes.append(f"Priority changed from {c.priority.value} to {req.priority.value}")
        c.priority = req.priority
    if req.category_id:
        cat = db.query(Category).filter(Category.id == req.category_id).first()
        if cat:
            changes.append(f"Category changed to {cat.name}")
            c.category_id = req.category_id
    if req.assigned_officer_id:
        off = db.query(User).filter(User.id == req.assigned_officer_id, User.role == UserRole.OFFICER).first()
        if off:
            changes.append(f"Assigned officer changed to {off.name}")
            c.assigned_officer_id = off.id
            c.status = ComplaintStatus.ASSIGNED

    c.ai_confidence = 1.0 # Admin manual override sets confidence to 100%
    c.updated_at = datetime.utcnow()

    # Log history
    hist = ComplaintStatusHistory(
        complaint_id=c.id,
        status=c.status,
        note="AI Triage manually overridden by Admin: " + ", ".join(changes),
        changed_by_user_id=current_user.id
    )
    db.add(hist)

    db.commit()
    db.refresh(c)
    return format_complaint_response(c)

# --- User Management CRUD ---
@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.name.asc()).all()

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user_by_admin(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User email already exists")

    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        mobile=user_in.mobile,
        role=user_in.role,
        village_id=user_in.village_id,
        department_id=user_in.department_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
