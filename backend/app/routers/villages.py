from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Village
from app.schemas import VillageResponse

router = APIRouter(prefix="/villages", tags=["Villages"])

@router.get("", response_model=List[VillageResponse])
def list_villages(db: Session = Depends(get_db)):
    return db.query(Village).order_by(Village.name.asc()).all()
