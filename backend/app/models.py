import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    CITIZEN = "CITIZEN"
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"

class PriorityLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"

class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    district = Column(String(100), nullable=False, default="Panchayat District")
    state = Column(String(100), nullable=False, default="Telangana")
    population = Column(Integer, default=5000)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="village")
    complaints = relationship("Complaint", back_populates="village")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(20), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    categories = relationship("Category", back_populates="department")
    officers = relationship("User", back_populates="department")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(50), nullable=False, unique=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="categories")
    complaints = relationship("Complaint", back_populates="category")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    mobile = Column(String(20), nullable=True)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.CITIZEN)
    
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=True)
    pending_village_name = Column(String(100), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    village = relationship("Village", back_populates="users")
    department = relationship("Department", back_populates="officers")
    submitted_complaints = relationship("Complaint", foreign_keys="Complaint.citizen_id", back_populates="citizen")
    assigned_complaints = relationship("Complaint", foreign_keys="Complaint.assigned_officer_id", back_populates="assigned_officer")
    notifications = relationship("Notification", back_populates="user")
    officer_notes = relationship("OfficerNote", back_populates="officer")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    reference_id = Column(String(30), unique=True, index=True, nullable=False)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    photo_url = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address_text = Column(String(255), nullable=True)
    
    priority = Column(SQLEnum(PriorityLevel), nullable=False, default=PriorityLevel.MEDIUM)
    status = Column(SQLEnum(ComplaintStatus), nullable=False, default=ComplaintStatus.SUBMITTED)
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    ai_confidence = Column(Float, default=0.85)
    duplicate_of_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    resolution_proof_url = Column(String(255), nullable=True)
    is_escalated = Column(Boolean, default=False)
    escalation_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    citizen = relationship("User", foreign_keys=[citizen_id], back_populates="submitted_complaints")
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id], back_populates="assigned_complaints")
    category = relationship("Category", back_populates="complaints")
    village = relationship("Village", back_populates="complaints")
    duplicate_of = relationship("Complaint", remote_side=[id])
    
    status_history = relationship("ComplaintStatusHistory", back_populates="complaint", cascade="all, delete-orphan")
    officer_notes = relationship("OfficerNote", back_populates="complaint", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="complaint", cascade="all, delete-orphan")

class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    status = Column(SQLEnum(ComplaintStatus), nullable=False)
    note = Column(Text, nullable=True)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="status_history")
    changed_by = relationship("User")

class OfficerNote(Base):
    __tablename__ = "officer_notes"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="officer_notes")
    officer = relationship("User", back_populates="officer_notes")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
    complaint = relationship("Complaint", back_populates="notifications")
