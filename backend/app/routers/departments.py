from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Department, Category, UserRole
from app.schemas import DepartmentResponse, DepartmentCreate, CategoryResponse, CategoryCreate
from app.auth import get_current_user

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).order_by(Department.name.asc()).all()

@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    req: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only Sarpanch / Admin can create new departments")

    existing_name = db.query(Department).filter(Department.name == req.name).first()
    if existing_name:
        raise HTTPException(status_code=400, detail="Department with this name already exists")

    existing_code = db.query(Department).filter(Department.code == req.code.upper()).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Department with this code already exists")

    dept = Department(
        name=req.name,
        code=req.code.upper(),
        description=req.description
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.name.asc()).all()

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    req: CategoryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only Sarpanch / Admin can create new categories")

    dept = db.query(Department).filter(Department.id == req.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    existing_name = db.query(Category).filter(Category.name == req.name).first()
    if existing_name:
        raise HTTPException(status_code=400, detail="Category with this name already exists")

    existing_code = db.query(Category).filter(Category.code == req.code.upper()).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Category with this code already exists")

    cat = Category(
        name=req.name,
        code=req.code.upper(),
        department_id=req.department_id,
        description=req.description
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat
