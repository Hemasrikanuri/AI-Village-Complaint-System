import math
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import Complaint, Category, Department, User, UserRole, PriorityLevel, ComplaintStatus

URGENT_KEYWORDS = [
    "spark", "electric shock", "live wire", "wire snapped", "burst pipe", "major flood",
    "sewage overflow", "fire", "hazard", "danger", "emergency", "collapsed wall", "caved in"
]

HIGH_KEYWORDS = [
    "no water", "power outage", "dark street", "blackout", "blocked drain", "garbage dump",
    "deep pothole", "road cave", "open manhole", "contamination", "foul smell", "broken pole"
]

MEDIUM_KEYWORDS = [
    "pothole", "street light flicker", "trash", "slow water", "leak", "dirty water",
    "garbage bin full", "damaged bench", "drain cleaning"
]

def classify_complaint(
    title: str,
    description: str,
    db: Optional[Session] = None,
    category_id: Optional[int] = None,
    village_id: Optional[int] = None,
    photo_url: Optional[str] = None
) -> Tuple[PriorityLevel, float]:
    combined_text = (title + " " + description).lower()

    # Factor 1: Keyword Urgency Score (Weight 40%)
    kw_score = 0.25
    for kw in URGENT_KEYWORDS:
        if kw in combined_text:
            kw_score = 1.00
            break
    if kw_score < 1.00:
        for kw in HIGH_KEYWORDS:
            if kw in combined_text:
                kw_score = 0.75
                break
    if kw_score < 0.75:
        for kw in MEDIUM_KEYWORDS:
            if kw in combined_text:
                kw_score = 0.50
                break

    # Factor 2: Category Baseline Risk Score (Weight 30%)
    cat_score = 0.50
    if db and category_id:
        category = db.query(Category).filter(Category.id == category_id).first()
        if category and category.code:
            code = category.code.upper()
            if code in ["WATER_QUAL", "ELEC_OUTAGE", "ROAD_DRAIN"]:
                cat_score = 1.00
            elif code in ["WATER_LEAK", "ROAD_POTHOLE", "HEALTH_MOSQ"]:
                cat_score = 0.70
            elif code in ["ELEC_STREET", "SAN_GARBAGE", "SAN_TOILET"]:
                cat_score = 0.45
            else:
                cat_score = 0.50

    # Factor 3: Photographic Evidence Score (Weight 15%)
    photo_score = 1.00 if (photo_url and len(photo_url.strip()) > 0) else 0.40

    # Factor 4: Community Cluster / Recurrence Score (Weight 15%)
    cluster_score = 0.30
    if db and category_id and village_id:
        time_threshold = datetime.utcnow() - timedelta(hours=48)
        open_cluster_count = db.query(func.count(Complaint.id)).filter(
            Complaint.village_id == village_id,
            Complaint.category_id == category_id,
            Complaint.created_at >= time_threshold,
            Complaint.status.notin_([ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED])
        ).scalar() or 0

        if open_cluster_count >= 3:
            cluster_score = 1.00
        elif open_cluster_count >= 1:
            cluster_score = 0.70

    # Calculate Weighted Final Severity Score S in [0.0, 1.0]
    # Weights: 50% Keyword Urgency + 25% Category Baseline Risk + 15% Photo Evidence + 10% Community Cluster
    total_score = (0.50 * kw_score) + (0.25 * cat_score) + (0.15 * photo_score) + (0.10 * cluster_score)

    # Priority & Confidence Determination
    if total_score >= 0.78:
        priority = PriorityLevel.URGENT
        confidence = 0.95
    elif total_score >= 0.58:
        priority = PriorityLevel.HIGH
        confidence = 0.90
    elif total_score >= 0.38:
        priority = PriorityLevel.MEDIUM
        confidence = 0.85
    else:
        priority = PriorityLevel.LOW
        confidence = 0.80

    return priority, round(confidence, 2)

def detect_duplicate_complaint(
    db: Session,
    village_id: int,
    category_id: int,
    title: str,
    latitude: Optional[float],
    longitude: Optional[float]
) -> Optional[int]:
    time_threshold = datetime.utcnow() - timedelta(hours=48)
    
    query = db.query(Complaint).filter(
        Complaint.village_id == village_id,
        Complaint.category_id == category_id,
        Complaint.created_at >= time_threshold,
        Complaint.status.notin_([ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED])
    )
    
    candidates = query.all()
    
    title_words = set(title.lower().split())
    
    for c in candidates:
        # Check geo proximity (within ~500m / 0.005 degrees)
        is_close = False
        if latitude is not None and longitude is not None and c.latitude is not None and c.longitude is not None:
            dist_sq = (latitude - c.latitude)**2 + (longitude - c.longitude)**2
            if math.sqrt(dist_sq) <= 0.005:
                is_close = True
                
        # Check title similarity
        cand_words = set(c.title.lower().split())
        overlap = title_words.intersection(cand_words)
        is_text_similar = len(overlap) >= 2 or (len(title_words) > 0 and len(overlap) / len(title_words) >= 0.5)
        
        if is_close or is_text_similar:
            return c.id
            
    return None

def assign_officer_load_balanced(
    db: Session,
    category_id: int,
    village_id: int
) -> Optional[User]:
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        return None
        
    dept_id = category.department_id
    
    # 1. Look for officers in this department assigned specifically to this village
    officers = db.query(User).filter(
        User.role == UserRole.OFFICER,
        User.department_id == dept_id,
        User.village_id == village_id
    ).all()
    
    # 2. If no village-specific officer found, fallback to any officer in this department
    if not officers:
        officers = db.query(User).filter(
            User.role == UserRole.OFFICER,
            User.department_id == dept_id
        ).all()
        
    if not officers:
        return None
        
    # 3. Calculate workload (count of non-resolved, non-rejected complaints) for each candidate officer
    officer_workloads = []
    for officer in officers:
        open_count = db.query(func.count(Complaint.id)).filter(
            Complaint.assigned_officer_id == officer.id,
            Complaint.status.notin_([ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED])
        ).scalar()
        officer_workloads.append((open_count, officer))
        
    # Sort by fewest active complaints first
    officer_workloads.sort(key=lambda x: x[0])
    
    return officer_workloads[0][1]
