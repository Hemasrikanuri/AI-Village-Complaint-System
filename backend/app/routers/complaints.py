import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import (
    Complaint, ComplaintStatusHistory, OfficerNote, Notification, User, UserRole,
    ComplaintStatus, PriorityLevel, Category, Village, Department
)
from app.schemas import (
    ComplaintResponse, ComplaintStatusUpdate, OfficerNoteCreate, OfficerNoteResponse,
    StatusHistoryResponse
)
from app.auth import get_current_user, require_roles
from app.ai_triage import classify_complaint, detect_duplicate_complaint, assign_officer_load_balanced

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def format_complaint_response(c: Complaint) -> dict:
    return {
        "id": c.id,
        "reference_id": c.reference_id,
        "citizen_id": c.citizen_id,
        "citizen_name": c.citizen.name if c.citizen else None,
        "citizen_mobile": c.citizen.mobile if c.citizen else None,
        "citizen_email": c.citizen.email if c.citizen else None,
        "category_id": c.category_id,
        "category_name": c.category.name if c.category else None,
        "department_name": c.category.department.name if c.category and c.category.department else None,
        "village_id": c.village_id,
        "village_name": c.village.name if c.village else None,
        "title": c.title,
        "description": c.description,
        "photo_url": c.photo_url,
        "latitude": c.latitude,
        "longitude": c.longitude,
        "address_text": c.address_text,
        "priority": c.priority,
        "status": c.status,
        "assigned_officer_id": c.assigned_officer_id,
        "assigned_officer_name": c.assigned_officer.name if c.assigned_officer else "Unassigned",
        "ai_confidence": c.ai_confidence,
        "duplicate_of_id": c.duplicate_of_id,
        "rejection_reason": c.rejection_reason,
        "resolution_proof_url": c.resolution_proof_url,
        "is_escalated": c.is_escalated,
        "escalation_reason": c.escalation_reason,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
        "status_history": [
            {
                "id": h.id,
                "complaint_id": h.complaint_id,
                "status": h.status,
                "note": h.note,
                "changed_by_user_id": h.changed_by_user_id,
                "timestamp": h.timestamp,
                "changed_by_name": h.changed_by.name if h.changed_by else None
            } for h in c.status_history
        ],
        "officer_notes": [
            {
                "id": n.id,
                "complaint_id": n.complaint_id,
                "officer_id": n.officer_id,
                "officer_name": n.officer.name if n.officer else None,
                "note_text": n.note_text,
                "created_at": n.created_at
            } for n in c.officer_notes
        ]
    }

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_complaint(
    title: str = Form(...),
    description: str = Form(...),
    category_id: int = Form(...),
    village_id: int = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    address_text: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_roles([UserRole.CITIZEN, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    # Validate photo upload limits if photo provided
    photo_url = None
    if photo and photo.filename:
        # Check extension
        ext = os.path.splitext(photo.filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
            
        # Read file contents to verify size limit (5MB)
        contents = await photo.read()
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )
            
        # Save photo to upload directory
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as f:
            f.write(contents)
        photo_url = f"/uploads/{unique_filename}"

    # Verify category and village existence
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=400, detail="Invalid category ID")
    vil = db.query(Village).filter(Village.id == village_id).first()
    if not vil:
        raise HTTPException(status_code=400, detail="Invalid village ID")

    # Generate Human Readable Reference ID: GS-2026-XXXX
    year = datetime.utcnow().year
    count = db.query(Complaint).count() + 1
    ref_id = f"GS-{year}-{count:04d}"

    # AI Triage Step: Classify Priority & Confidence using Multi-Factor Scoring
    priority, ai_confidence = classify_complaint(
        title=title,
        description=description,
        db=db,
        category_id=category_id,
        village_id=village_id,
        photo_url=photo_url
    )

    # AI Duplicate Detection
    duplicate_of_id = detect_duplicate_complaint(
        db, village_id=village_id, category_id=category_id,
        title=title, latitude=latitude, longitude=longitude
    )

    # Automatic Load-Balanced Officer Assignment
    assigned_officer = assign_officer_load_balanced(db, category_id=category_id, village_id=village_id)
    assigned_officer_id = assigned_officer.id if assigned_officer else None
    initial_status = ComplaintStatus.ASSIGNED if assigned_officer else ComplaintStatus.SUBMITTED

    # Create Complaint Record
    complaint = Complaint(
        reference_id=ref_id,
        citizen_id=current_user.id,
        category_id=category_id,
        village_id=village_id,
        title=title,
        description=description,
        photo_url=photo_url,
        latitude=latitude,
        longitude=longitude,
        address_text=address_text,
        priority=priority,
        status=initial_status,
        assigned_officer_id=assigned_officer_id,
        ai_confidence=ai_confidence,
        duplicate_of_id=duplicate_of_id
    )
    db.add(complaint)
    db.flush()

    # Log initial status history
    hist = ComplaintStatusHistory(
        complaint_id=complaint.id,
        status=initial_status,
        note=f"Complaint registered via mobile/web. Auto-classified as {priority.value}.",
        changed_by_user_id=current_user.id
    )
    db.add(hist)

    # Notifications
    cit_notif = Notification(
        user_id=current_user.id,
        complaint_id=complaint.id,
        message=f"Your complaint ({ref_id}) has been submitted successfully." + 
                (f" Assigned to Officer {assigned_officer.name}." if assigned_officer else " Pending officer assignment.")
    )
    db.add(cit_notif)

    if assigned_officer:
        off_notif = Notification(
            user_id=assigned_officer.id,
            complaint_id=complaint.id,
            message=f"New complaint ({ref_id}) assigned to you: '{title}' in {vil.name}."
        )
        db.add(off_notif)

    db.commit()
    db.refresh(complaint)
    return format_complaint_response(complaint)

@router.get("")
def list_complaints(
    status_filter: Optional[ComplaintStatus] = Query(None),
    priority_filter: Optional[PriorityLevel] = Query(None),
    village_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)

    # Role-based scoping
    if current_user.role == UserRole.CITIZEN:
        query = query.filter(Complaint.citizen_id == current_user.id)
    elif current_user.role == UserRole.OFFICER:
        # Officer dashboard MUST only return complaints assigned to them
        query = query.filter(Complaint.assigned_officer_id == current_user.id)

    # Optional Filters
    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    if priority_filter:
        query = query.filter(Complaint.priority == priority_filter)
    if village_id:
        query = query.filter(Complaint.village_id == village_id)
    if category_id:
        query = query.filter(Complaint.category_id == category_id)

    query = query.order_by(Complaint.created_at.desc())
    results = query.all()
    return [format_complaint_response(c) for c in results]

@router.get("/track/{ref_or_id}")
def track_complaint(
    ref_or_id: str,
    db: Session = Depends(get_db)
):
    complaint = None
    if ref_or_id.isdigit():
        complaint = db.query(Complaint).filter(Complaint.id == int(ref_or_id)).first()
    if not complaint:
        complaint = db.query(Complaint).filter(Complaint.reference_id == ref_or_id).first()
        
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found with reference ID or ID")
        
    return format_complaint_response(complaint)

@router.get("/{complaint_id}")
def get_complaint_by_id(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    # Check access
    if current_user.role == UserRole.CITIZEN and c.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == UserRole.OFFICER and c.assigned_officer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return format_complaint_response(c)

@router.patch("/{complaint_id}/status")
def update_complaint_status(
    complaint_id: int,
    update_data: ComplaintStatusUpdate,
    current_user: User = Depends(require_roles([UserRole.OFFICER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    if current_user.role == UserRole.OFFICER and c.assigned_officer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Officer can only update status for complaints assigned to them")

    if update_data.status == ComplaintStatus.REJECTED and not update_data.rejection_reason:
        raise HTTPException(status_code=400, detail="Rejection reason is required when rejecting a complaint")

    c.status = update_data.status
    if update_data.rejection_reason:
        c.rejection_reason = update_data.rejection_reason
    c.updated_at = datetime.utcnow()

    # Record status history
    hist = ComplaintStatusHistory(
        complaint_id=c.id,
        status=update_data.status,
        note=update_data.note or (f"Status changed to {update_data.status.value}" + (f": {update_data.rejection_reason}" if update_data.rejection_reason else "")),
        changed_by_user_id=current_user.id
    )
    db.add(hist)

    # Notify Citizen
    notif = Notification(
        user_id=c.citizen_id,
        complaint_id=c.id,
        message=f"Status for your complaint {c.reference_id} updated to {update_data.status.value}."
    )
    db.add(notif)

    db.commit()
    db.refresh(c)
    return format_complaint_response(c)

@router.post("/{complaint_id}/notes", response_model=OfficerNoteResponse)
def add_officer_note(
    complaint_id: int,
    note_in: OfficerNoteCreate,
    current_user: User = Depends(require_roles([UserRole.OFFICER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == UserRole.OFFICER and c.assigned_officer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Officer can only add notes to assigned complaints")

    note = OfficerNote(
        complaint_id=c.id,
        officer_id=current_user.id,
        note_text=note_in.note_text
    )
    db.add(note)

    # Notify Citizen
    notif = Notification(
        user_id=c.citizen_id,
        complaint_id=c.id,
        message=f"New field update note added by Officer on complaint {c.reference_id}."
    )
    db.add(notif)

    db.commit()
    db.refresh(note)

    return {
        "id": note.id,
        "complaint_id": note.complaint_id,
        "officer_id": note.officer_id,
        "officer_name": current_user.name,
        "note_text": note.note_text,
        "created_at": note.created_at
    }

@router.post("/{complaint_id}/resolution-proof")
def upload_resolution_proof(
    complaint_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles([UserRole.OFFICER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == UserRole.OFFICER and c.assigned_officer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Invalid photo format. Only JPG, PNG, WEBP allowed.")

    contents = file.file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds limit.")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = f"proof_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    c.resolution_proof_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(c)
    return format_complaint_response(c)

@router.post("/{complaint_id}/escalate")
def escalate_complaint(
    complaint_id: int,
    reason: str = Form(...),
    current_user: User = Depends(require_roles([UserRole.OFFICER])),
    db: Session = Depends(get_db)
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if c.assigned_officer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Officer can only escalate assigned complaints")

    c.is_escalated = True
    c.escalation_reason = reason
    c.updated_at = datetime.utcnow()

    # Log in status history
    hist = ComplaintStatusHistory(
        complaint_id=c.id,
        status=c.status,
        note=f"⚠️ ESCALATED TO ADMIN: {reason}",
        changed_by_user_id=current_user.id
    )
    db.add(hist)

    # Notify Admins
    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    for adm in admins:
        n = Notification(
            user_id=adm.id,
            complaint_id=c.id,
            message=f"🚨 Complaint {c.reference_id} was ESCALATED by Officer {current_user.name}: {reason[:50]}"
        )
        db.add(n)

    db.commit()
    db.refresh(c)
    return format_complaint_response(c)
