from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from app.models import UserRole, PriorityLevel, ComplaintStatus

# --- Auth & User Schemas ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    mobile: Optional[str] = None
    role: UserRole = UserRole.CITIZEN
    village_id: Optional[int] = None
    pending_village_name: Optional[str] = None
    department_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[UserRole] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# --- Village & Department & Category Schemas ---
class VillageBase(BaseModel):
    name: str
    district: str = "Panchayat District"
    state: str = "Telangana"
    population: int = 5000
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class VillageCreate(VillageBase):
    pass

class VillageResponse(VillageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    code: str
    department_id: int
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    department: Optional[DepartmentResponse] = None

    class Config:
        from_attributes = True

# --- Complaint History & Notes ---
class StatusHistoryResponse(BaseModel):
    id: int
    complaint_id: int
    status: ComplaintStatus
    note: Optional[str] = None
    changed_by_user_id: int
    timestamp: datetime
    changed_by_name: Optional[str] = None

    class Config:
        from_attributes = True

class OfficerNoteCreate(BaseModel):
    note_text: str

class OfficerNoteResponse(BaseModel):
    id: int
    complaint_id: int
    officer_id: int
    officer_name: Optional[str] = None
    note_text: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Complaint Schemas ---
class ComplaintCreate(BaseModel):
    category_id: int
    village_id: int
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address_text: Optional[str] = None

class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    note: Optional[str] = None
    rejection_reason: Optional[str] = None

class TriageOverrideRequest(BaseModel):
    priority: Optional[PriorityLevel] = None
    category_id: Optional[int] = None
    assigned_officer_id: Optional[int] = None

class ReassignComplaintRequest(BaseModel):
    assigned_officer_id: int
    reason: Optional[str] = None

class EscalateComplaintRequest(BaseModel):
    reason: str = Field(..., min_length=5)

class ComplaintResponse(BaseModel):
    id: int
    reference_id: str
    citizen_id: int
    citizen_name: Optional[str] = None
    citizen_mobile: Optional[str] = None
    citizen_email: Optional[str] = None
    category_id: int
    category_name: Optional[str] = None
    department_name: Optional[str] = None
    village_id: int
    village_name: Optional[str] = None
    
    title: str
    description: str
    photo_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address_text: Optional[str] = None
    
    priority: PriorityLevel
    status: ComplaintStatus
    assigned_officer_id: Optional[int] = None
    assigned_officer_name: Optional[str] = None
    
    ai_confidence: float
    duplicate_of_id: Optional[int] = None
    rejection_reason: Optional[str] = None
    resolution_proof_url: Optional[str] = None
    is_escalated: bool = False
    escalation_reason: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    
    status_history: List[StatusHistoryResponse] = []
    officer_notes: List[OfficerNoteResponse] = []

    class Config:
        from_attributes = True

# --- Notifications ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    complaint_id: Optional[int] = None
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Admin Analytics & Dashboard Schemas ---
class AdminDashboardStats(BaseModel):
    total_complaints: int
    resolved_complaints: int
    pending_complaints: int
    rejected_complaints: int
    in_progress_complaints: int
    resolution_rate_pct: float
    avg_resolution_time_hours: float
    urgent_complaints_count: int

class DepartmentSLAStats(BaseModel):
    department_id: int
    department_name: str
    total_assigned: int
    resolved: int
    pending: int
    avg_resolution_hours: float
    overdue_count: int
